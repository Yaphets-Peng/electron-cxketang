const logger = require("../common/Logger");

const baseController = require("../controller/BaseController");

logger.info("AppController-初始化");

console.log($("#hideWindow").text());

$("#openWindow").on("click", function () {
  baseController.openNewWindow("demo", {
    window: { width: 500, height: 400 },
    name: "t1",
  });
});

$("#openWindow2").on("click", function () {
  baseController.openNewWindow("demo2", {
    name: "t1",
  });
});

$("#openWindow3").on("click", function () {
  baseController.openNewWindow("https://k.chaoxing.com/pc/meet/index?v=v2", {
    name: "t1",
    isWeb: true,
  });
});
