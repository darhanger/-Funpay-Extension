if (userData["calculator-lots"]?.active) {
    $(".container").eq(1).append(`
        <div class="stats-part">
            Количество товара:
            <span id="count-part">загрузка...</span>
            <br>
            Сумма всех товаров:
            <span id="summa-part">загрузка...</span>
        </div>
    `);

    (async () => {
        await waitForTradeRows();

        const calculator = await collectTradeStats();

        $("#count-part").text(formatTradeCount(calculator));
        $("#summa-part").text(formatTradeTotals(calculator.totals));
    })();
}

function collectTradeStats(stats = { count: 0, counts: {}, totals: {} }) {
    const data = $(document);

    data.find(".tc-item").has(".tc-price").each((_, element) => {
        const lot = $(element);
        const price = getPriceFromElement(lot.find(".tc-price").first());
        const currency = price.currency || "₽";
        const amount = getLotAmount(lot);

        if (!price.amount || !amount) { return }

        stats.count += amount;
        stats.counts[currency] = (stats.counts[currency] || 0) + amount;
        stats.totals[currency] = (stats.totals[currency] || 0) + (price.amount * amount);
    });

    return stats;
}

function waitForTradeRows() {
    if ($(".tc-item .tc-price").length) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        const observer = new MutationObserver(() => {
            if (!$(".tc-item .tc-price").length) { return }

            observer.disconnect();
            resolve();
        });

        observer.observe(document, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            resolve();
        }, 5000);
    });
}

function getLotAmount(lot) {
    const amountText = lot.find(".tc-amount").first().text().trim();
    const amount = parseLocaleNumber(amountText);

    return amount > 0 ? amount : 1;
}

function formatTradeCount(stats) {
    const currencies = Object.keys(stats.counts);

    if (currencies.length <= 1) {
        return stats.count;
    }

    const byCurrency = currencies
        .sort(currencySort)
        .map((currency) => `${currency}: ${stats.counts[currency]}`)
        .join(", ");

    return `${stats.count} (${byCurrency})`;
}

function formatTradeTotals(totals) {
    const currencies = Object.keys(totals);

    if (!currencies.length) {
        return formatMoney(0, "₽");
    }

    return currencies
        .sort(currencySort)
        .map((currency) => formatMoney(totals[currency], currency))
        .join(" / ");
}

function currencySort(left, right) {
    const order = { "₽": 0, "$": 1, "€": 2 };

    return (order[left] ?? 99) - (order[right] ?? 99);
}
