const logger = require("../common/Logger");

const baseController = require("../controller/BaseController");

logger.info("DemoController-初始化");

var args = baseController.getWindowArgs();

console.log(args);
