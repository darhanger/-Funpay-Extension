if (userData.analitik?.active) {
    const parent = $(".col-md-3.col-sm-4.hidden-xs .pull-right");

    parent.prepend(`<a class="btn btn-default btn-wide analitik">Анализировать рынок</a>`);

    $(".col-md-3.col-sm-4.hidden-xs").append(`<div class="analitik-table"><table class="analitik-block"><tr><th>Проанализировано лотов</th><td id="count"></td></tr><tr><th>Максимальная цена</th><td id="max-price"></td></tr><tr><th>Минимальная цена</th><td id="min-price"></td></tr><tr><th>Средняя цена</th><td id="average"></td>        </tr>        <tr>            <th>Различных продавцов</th>            <td id="individual-sellers"></td>        </tr>        <tr>            <th>Не рублевки</th>            <td id="ruble-plus"></td>        </tr>        <tr>            <th>Проверенных продавцов</th>            <td id="verified-sellers"></td>        </tr>    </table>    <button class="hide-parent">Скрыть</button></div>`);

    $(".analitik").on("click", async () => {
        const data = analyzeLots($(".tc-item"));

        Object.keys(data).forEach(( element ) => { // вставляем все данные в html страницу
            $(`.analitik-table #${element}`).text(data[element]);
        });

        $(".analitik-table").css("display", "flex");
    });

    $(".hide-parent").on("click", function() { $(this).parents(".analitik-table").css("display", "none") });
}

function analyzeLots(lots) {
    const prices = [];
    const sellers = new Set();
    let currency = "₽";
    let rublePlus = 0;
    let verifiedSellers = 0;

    lots.each((_, element) => {
        const lot = $(element);
        const priceElement = lot.find(".tc-price").first();

        if (!priceElement.length) { return }

        const price = getPriceFromElement(priceElement, currency);
        const seller = lot.find(".media-user-name, .media-body a, .media-body span").first().text().trim();
        const hasVerifiedMark = lot.find(".label-success, .media-user-status, .rating-mini-count").filter((_, mark) => {
            const text = $(mark).text().trim();

            return text && text != "0";
        }).length > 0;

        prices.push(price.amount);
        currency = price.currency || currency;

        if (seller) { sellers.add(seller) }
        if (!Number.isInteger(price.amount)) { rublePlus++ }
        if (hasVerifiedMark) { verifiedSellers++ }
    });

    const sum = prices.reduce((result, price) => result + price, 0);
    const max = prices.length ? Math.max(...prices) : 0;
    const min = prices.length ? Math.min(...prices) : 0;
    const average = prices.length ? sum / prices.length : 0;

    return {
        count: prices.length,
        "max-price": formatMoney(max, currency),
        "min-price": formatMoney(min, currency),
        average: formatMoney(average, currency),
        "individual-sellers": sellers.size,
        "ruble-plus": rublePlus,
        "verified-sellers": verifiedSellers
    };
}

if (userData["download-lots"]?.active) {
    const parent = $(".col-md-3.col-sm-4.hidden-xs .pull-right")

    const data = {};

    $(".tc-item").each(( index, element ) => {
        const lot = $(element);

        data[lot.find(".tc-desc-text").text()] = {
            url: lot.attr("href"),
            price: lot.find(".tc-price").data("s"),
            seller: lot.find(".media-body span").text(),
            sellerReview: lot.find(".rating-mini-count").text()
        }
    });

    const blob = new Blob([JSON.stringify(data, null, 4)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    parent.prepend(`<a href="${url}" download="lots.json" class="btn btn-default btn-wide export-lot">Экспорт лотов</a>`);
}
