const fs = require("fs");
const path = require("path");

function main() {
	let oldJsPath = path.join(path.resolve(__dirname, ".."), "node_modules", "agora-electron-sdk", "js");
	DeleteDirectory(oldJsPath);
	console.log("删除本地node_modules中js文件");

	let oldBuildPath = path.join(path.resolve(__dirname, ".."), "node_modules", "agora-electron-sdk", "build");
	DeleteDirectory(oldBuildPath);
	console.log("删除本地node_modules中build文件");

	let newPath = path.join(path.resolve(__dirname, ".."), "agaro", process.platform);
	let dirs = fs.readdirSync(newPath);
	if (dirs.length == 0) {
		throw new Error("请检查agaro(" + process.platform + ")本地文件是否为空", newPath);
		return;
	}
	let oldPath = path.join(path.resolve(__dirname, ".."), "node_modules", "agora-electron-sdk");
	CopyDirectory(newPath, oldPath);
	console.log("拷贝agaro(" + process.platform + ")本地文件 copy ", newPath, " to ", oldPath);
}

//拷贝文件夹
function CopyDirectory(src, dest) {
	if (fs.existsSync(dest) == false) {
		fs.mkdirSync(dest);
	}
	if (fs.existsSync(src) == false) {
		return false;
	}
	//console.log("copy src:" + src + ", dest:" + dest);
	// 拷贝新的内容进去
	let dirs = fs.readdirSync(src);
	dirs.forEach(function (item) {
		let item_path = path.join(src, item);
		let temp = fs.statSync(item_path);
		if (temp.isFile()) {
			// 是文件
			fs.copyFileSync(item_path, path.join(dest, item));
		} else if (temp.isDirectory()) {
			// 是目录
			CopyDirectory(item_path, path.join(dest, item));
		}
	});
}

// 删除文件夹
function DeleteDirectory(dir) {
	if (fs.existsSync(dir) == true) {
		let files = fs.readdirSync(dir);
		files.forEach(function (item) {
			let item_path = path.join(dir, item);
			// console.log("del "+item_path);
			if (fs.statSync(item_path).isDirectory()) {
				DeleteDirectory(item_path);
			} else {
				fs.unlinkSync(item_path);
			}
		});
		fs.rmdirSync(dir);
	}
}

main();