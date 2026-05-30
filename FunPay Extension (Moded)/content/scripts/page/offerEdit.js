if (userData["translate-product"]?.active) {
    $(".form-group.lot-field.bg-light-color.modal-custom-bg-block.modal-custom-bg-block-top").append(`<label class="translate-state control-label">Автоматический переводчик включен</label>`);

    $(`[name="fields[desc][ru]"], [name="fields[summary][ru]"], [name="fields[payment_msg][ru]"]`).on("change", async function() {
        const type = $(this).attr("name").split("[")[1].split("]")[0];

        const result = await translate($(`[name="fields[${type}][ru]"]`).val(), "ru", "en");
        
        $(`[name="fields[${type}][en]"]`).val(result);
    });
}

if (userData["exact-price"]?.active) {
    const inputPrice = $(`input[name="price"]`);

    inputPrice.after(`<div class="set-exact-price">Сделать цену ровной</div>`);   

    $(".set-exact-price").on("click", () => {
        const price = parseLocaleNumber(inputPrice.val());
        const commisia = parseMoney($(".js-calc-table-body").find("tr").eq(3).find("td").text()).amount;
        
        if (!/[0-9]/.test(price.toString()) || commisia === 0) { return }
        
        inputPrice.val((price / (1 + (((commisia - price)/price)))).toFixed(2));
    });
}

if (userData["sale-panel"]?.active) {
    (async () => {
        const res = await fetch($(".js-back-link").attr("href").split("trade")[0]);
        const lots = await res.text();

        $(".btn.btn-primary.btn-block.js-btn-save").parent(".margin-top").after(buildSalePanel(lots));

        $(".set-price").on("click", function() {
            const price = parseMoney($(this).parents(".panel-product").find(".product-price").text()).amount;

            $(`.form-control[name="price"]`).val(Math.max(price - 0.01, 0).toFixed(2));
        });
    })();
}

function buildSalePanel(html) {
    const page = $(html);
    const products = page.find(".tc-item").map((_, element) => {
        const lot = $(element);
        const price = getPriceFromElement(lot.find(".tc-price").first());
        const name = lot.find(".tc-desc-text").text().trim() || lot.find(".tc-title").text().trim() || "Лот";
        const seller = lot.find(".media-user-name, .media-body a, .media-body span").first().text().trim();
        const url = lot.attr("href") || "#";

        if (!price.amount) { return null }

        return {
            name,
            seller,
            url,
            amount: price.amount,
            currency: price.currency
        };
    }).get().sort((a, b) => a.amount - b.amount);

    const rows = products.slice(0, 20).map((product) => `
        <div class="panel-product">
            <a class="product-name" href="${product.url}" target="_blank">${escapeHtml(product.seller || "Продавец")}</a>
            <span class="product-description">${escapeHtml(product.name)}</span>
            <span class="product-price">${formatMoney(product.amount, product.currency)}</span>
            <button type="button" class="set-price btn btn-xs btn-default">-0.01</button>
        </div>
    `).join("");

    return `
        <div class="sale-panel">
            <div class="title-block">Локальный анализ рынка</div>
            <div class="settings-block background-info">Показаны ближайшие цены с текущей страницы категории.</div>
            <div class="panel-products">
                ${rows || "<span>Лоты для сравнения не найдены.</span>"}
            </div>
        </div>
    `;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;");
}

if (userData["set-word"]?.active) {
    $(".lot-fields-multilingual").append(`
        <div class="form-group modal-custom-bg-block bg-light-color">
            <label class="control-label">шрифт</label>
            <select class="form-control select-shrift">
                <option value="">Выберите шрифт</option>
                    <option value="small">ᴨоᴨᴩобуй ϶ᴛоᴛ ɯᴩиɸᴛ</option>
                    <option value="canad">ᴨᗝᴨᴩᗝᘜᎽᕫ ϶ᴛᗝᴛ ɯᴩᑌɸᴛ</option>
                    <option value="runi">ᚢᛜᚢᚹᛜᎶᚴᛋ Ⰵᛠᛜᛠ Ⱎᚹᛋᛄᛠ</option>
                    <option value="efilopia">ከዐከየዐፔነህ ጓፐዐፐ ሠየሀዋፐ</option>
                    <option value="angle">⧼п⧽⧼о⧽⧼п⧽⧼р⧽⧼о⧽⧼б⧽⧼у⧽⧼й⧽ ⧼э⧽⧼т⧽⧼о⧽⧼т⧽ ⧼ш⧽⧼р⧽⧼и⧽⧼ф⧽⧼т⧽</option>
            </select>
        </div>
    `);

    $(".lot-field-input").on("input", function(event) {
        const text = event.originalEvent.data;

        if (!text) { return }
        const newFonts = fonts[$(".select-shrift").val()][text.toLowerCase()];

        $(this).val(
            $(this).val().slice(0, -1) + (newFonts ? newFonts : text)
        )
    });
}
