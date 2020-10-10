window.onload = function () {
  var script = document.createElement("script");
  script.src = "https://passport2.chaoxing.com/js/jquery.min.js";
  script.onload = script.onreadystatechange = function () {
    $(document).ready(function () {
      $("#phone").val("13163200189");
    });
  };
  document.body.appendChild(script);
};
