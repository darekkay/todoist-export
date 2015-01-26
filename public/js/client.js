$(document).ready(function () {

    $("input[name=export]:radio").change(function () {

        var showFormat = $("input[name=export]:checked").val() === "tasks";

        if (showFormat) {
            $("#format").slideDown();
        }
        else {
            $("#format").slideUp();
        }

    });

});