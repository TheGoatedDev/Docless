const { execFileSync } = require("node:child_process");
const { join } = require("node:path");

exports.default = (context) => {
    if (context.electronPlatformName !== "darwin") return;
    const app = join(
        context.appOutDir,
        `${context.packager.appInfo.productFilename}.app`,
    );
    execFileSync("xattr", ["-cr", app]);
    execFileSync("codesign", ["--force", "--deep", "--sign", "-", app]);
};
