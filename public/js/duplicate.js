$(document).ready(function () {
    $("#uid").on("focusout", function (e) {
        var id = $("#uid").val();
        if (id == '' || id.length == 0) { return false; }

        axios({
            url: '/duplicate',
            method: 'post',
            data: {
                uid: id,
            },
        }).then(function(data) {
            if (data.data) {
                $("#lUid").attr("hidden", true)
                $("#reg").attr("type", "submit");
            } else {
                $("#lUid").attr("hidden", false)
                $("#reg").attr("type", "button");
            }
        })
    });
})
