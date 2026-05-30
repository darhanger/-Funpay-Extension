if (userData["bind"]?.[0]) {
    $(".chat-float").append(`<div id="bind-chat" class="order-chat"></div>`);

    userData["bind"].forEach((element) => {  
        if (element.active) {
            $("#bind-chat").append(`<button class="btn_bind" value="${element.value.replaceAll("\"", "&quot;")}" data-send="${element["auto-send"]}">${element.name}</button>`);
        }
    });

    $(".btn_bind").on("click", function() {
        const bind = $(this);

        $(".chat-form-input textarea").val(
            bind.attr("value")
            .replaceAll("{name}", $(".media-body a").text())
            .replaceAll("{myname}", $(".user-link-name").eq(0).text())
            .replaceAll("{sell}", $(".badge.badge-trade")[0] ? $(".badge.badge-trade").eq(0).text() : "0")
        );
        
        const text_size = (37 + (bind.attr("value").split("\n").length - 1) * 17);
        $(".chat-form-input textarea").css("height", text_size + "px");

        if (JSON.parse(bind.data("send"))) { $(".btn.btn-gray.btn-round").click() }
    });
}
