if (!localStorage.getItem("secured")) { localStorage.setItem("secured", "[]") };
const UserSecured = JSON.parse(localStorage.getItem("secured"));

let selectLots;

if ($(".chat-float").length === 0 && userData["secured-lot"]?.active) {
    $(".offer-list-title-button").each(( index, element ) => {
        const offer = $(element).parents(".offer");
        const lot = $(element).prepend(`<a class="btn btn-plus secured-lot" data-key="${offer.find(".offer-list-title a").eq(0).attr("href").split("lots/")[1].split("/")[0]}">⭐</a>`);

        if (UserSecured.includes(String(lot.find(".secured-lot").data("key")))) { addSecured(offer) }
    });


    $(".mb20").on("click", ".secured-lot", function() { 
        const offer = $(this).parents(".offer");
        const lot_id = offer.find(".offer-list-title a").attr("href").split("lots/")[1].split("/")[0];

        if (UserSecured.includes(lot_id)) { return }

        addSecured(offer, lot_id); 
        saveSecured(lot_id);
    });

    $(".mb20").on("click", ".unsecured-lot", function() {
        if ($(".secured").length == 1) { $(".secured-title").remove() }
        
        $(this).parents(".offer").remove();
        saveSecured();
    });    
}

if (!$(".chat-profile-container")[0] && (userData["delete-lots"]?.active || userData["off-lots"]?.active || userData["dublicate"]?.active || userData["export-to-download"]?.active)) {
    $(".tc-header").append(`<div class="action-title">Выбрать</div>`);
    $(".tc-item").append(`
        <div class="action-lots">
            <label class="lot-box">
                <input type="checkbox" hidden />
                <span class="lot-mark"></span>
            </label>
        </div>
    `);

    $(".wrapper-content").append(`
        <div class="actions">
            <span class="log">Выберите действие</span>
            <div></div>
        </div>
    `);

    $(".lot-box input").on("change", () => {
        selectLots = $(".lot-box input:checked");
        
        $(".actions").css("display", selectLots.length == 0 ? "none" : "flex");
    });
}

if (userData["export-to-download"]?.active) {
    $(".actions div").append(`<button class="action-lot export-lot" value="true">Экспортировать с авто-выдачей</button>`);
    $(".actions div").append(`<button class="action-lot export-lot" value="false">Экспортировать</button>`);

    $(".export-lot").on("click", async function( event ) {
        let exportLot = [];

        await actionLot(selectLots.get(), async ( lot ) => {
            const id = {
                lot: lot.attr("href").split("id=")[1],
                part: lot.parents(".offer").find(".offer-list-title a").attr("href").split("lots/")[1].split("/")[0]
            }

            $(".log").text(`Идет экспорт || ${lot.find(".tc-desc-text").text()}`);

            const params = await getParams(id);
            
            const secrets = $(this).val() == "true"

            const body = (params.join("&") + "&location=&deleted=&active=on&node_id=" + id.part)
            .replace(/secrets=(.*?)&/, "secrets=$1&auto_delivery=on&")
            .replace(secrets ? "|dfdfsadf|fdsfsd,23" : /secrets=(.*?)&auto_delivery=on&/, `secrets=&`)

            exportLot.push(body);
        }, 1);

        const blob = new Blob([JSON.stringify(exportLot, null, 4)], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        const link = $(`<a href="${url}" download="lots ${$(".mr4").text()}.json"></a>`)[0];
        link.click();
    });
}

if ($(".chat-float").length === 0 && userData["dublicate"]?.active) {
    $(".actions div").append(`<button class="action-lot dublicate">Дублировать</button>`);

    $(".dublicate").on("click", function() {
        actionLot(selectLots.get(), async (lot) => {
            const id = {
                lot: lot.attr("href").split("id=")[1],
                part: lot.parents(".offer").find(".offer-list-title a").attr("href").split("lots/")[1].split("/")[0]
            }

            $(".log").text(`Идет дубликация || ${lot.find(".tc-desc-text").text()}`);

            const params = await getParams(id);

            const urlParams = params.join("&");

            await fetch("https://funpay.com/lots/offerSave", {
                "headers": {
                    "accept": "application/json, text/javascript, */*; q=0.01",
                    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                },
                "body":
                    `csrf_token=${$("body").data("app-data")["csrf-token"]}&`+
                    `offer_id=0&`+
                    `node_id=${id.part}&`+
                    `location=offer&`+
                    `deleted=&`+
                    `${urlParams}&`+
                    `active=on`
                ,
                "method": "POST",
            });

            lot.clone().appendTo(lot.parents(".table-hover"));
        }, 2);
    });
}

if (userData["off-lots"]?.active) {
    $(".actions div").append(`<button class="action-lot off-lot">Отключить</button>`);

    $(".off-lot").on("click", async function () {
        actionLot(selectLots.get(), async ( lot ) => {
            const id = {
                lot: lot.attr("href").split("id=")[1],
                part: lot.parents(".offer").find(".offer-list-title a").attr("href").split("lots/")[1].split("/")[0]
            }

            const lotEdit = await fetch(`https://funpay.com/lots/offerEdit?node=${id.part}&offer=${id.lot}&location=offer`);
            const htmlString = await lotEdit.text();

            $(".log").text(`Отключение лотов || ${lot.find(".tc-desc-text").text()}`);

            const params = serializeOfferForm(htmlString, {
                exclude: ["csrf_token", "secrets", "auto_delivery"],
                overrides: {
                    active: "",
                    deleted: "",
                    location: "offer"
                }
            });

            const result = await fetch("https://funpay.com/lots/offerSave", {
                "headers": {
                    "accept": "application/json, text/javascript, */*; q=0.01",
                    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                },
                "body":
                    `csrf_token=${$("body").data("app-data")["csrf-token"]}&`+
                    `${params.toString()}&`
                ,
                "method": "POST",
            });
            
            if (result.status == 200)
                lot.remove();
        }, 1);
    });
}

if ($(".chat-float").length === 0 && userData["delete-lots"]?.active) {
    $(".actions div").append(`<button class="action-lot delete-lot">Удалить</button>`);

    $(".delete-lot").on("click", async function() {
        actionLot(selectLots.get(), async ( lot ) => {
            const id = lot.attr("href").split("id=")[1];

            $(".log").text(`Идет удаление || ${lot.find(".tc-desc-text").text()}`);

            await fetch("https://funpay.com/lots/offerSave", {
                "headers": {
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                },
                "body": `csrf_token=${$("body").data("app-data")["csrf-token"]}&offer_id=${id}&location=offer&deleted=1`,
                "method": "POST"
            });

            if (lot.parents(".tc").find("a").length == 1) { lot.parents(".offer").remove() } 
            lot.remove();
        }, 1);
    });
}

function addSecured(offer) {
    offer.addClass("secured");

    if ($(".secured").length == 1) { $(".mb20").prepend(`<h5 class="mb10 text-bold secured-title">Закрепленые разделы</h5>`) }
    $(".mb10.text-bold").eq(0).after(offer);

    offer.find(".secured-lot").removeClass("secured-lot").addClass("unsecured-lot").text("🌟");
}

function saveSecured() {
    UserSecured.length = 0;

    $(".secured .offer-list-title a").each(( index, element ) => {
        UserSecured.unshift($(element).attr("href").split("lots/")[1].split("/")[0]);
    });

    localStorage.setItem("secured", JSON.stringify(UserSecured));
}

function actionLot(lots, callback, delay) {
    return new Promise(async (resolve) => {
        const lot = $(lots[0]).parents(".tc-item");

        await callback(lot);

        lots.shift()  

        if (lots[0]) {
            setTimeout(() => { 
                resolve( actionLot(lots, callback, delay) ) 
            }, delay * 1000);
        } else {
            resolve(true);
            $(".log").text(`Выберите действие`);
        }

        selectLots = $(".lot-box input:checked");
        $(".actions").css("display", selectLots.length == 0 ? "none" : "flex");
    });
};
