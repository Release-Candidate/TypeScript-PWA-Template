// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2022 Roland Csaszar
//
// Project:  ReScript-PWA-Template
// File:     gulpfile.cjs
// Date:     20.Feb.2022
//
// ==============================================================================
/* eslint-disable max-lines */
/* eslint-disable i18next/no-literal-string */
/* eslint-disable no-console */

//==============================================================================
// Directories and files.

// Name of the app.
const appName = "Typescript-PWA";

// The navigation scope of the PWA, the root path to the service worker.
const navScopePWA = "/";
const navScopeGitHub = `/${appName}/http/`;

// Service worker, TS file.
const serviceWorkerTS = "sw.ts";

// Service worker, JS file.
const serviceWorkerJS = "sw.js";

// Service worker, map file name.
const serviceWorkerJSMap = serviceWorkerJS + ".map";

// Service worker, full path.
const serviceWorkerTSPath = "./src/service_worker/" + serviceWorkerTS;

// App TS file.
const appTS = "app.ts";

// App JS file.
const appJS = "app.js";

// App, map file name
const appJSMap = appJS + ".map";

// Manifest filename (original).
const manifestJSON = "manifest.json";

// Name of the TailwindCSS config file.
const tailwindConfig = "./tailwind.config.js";

// CSS file to process by TailwindCSS.
const tailwindInput = "src/input.css";

// Name of the CSS file TailwindCSS produced in directory `outDir`.
const tailwindOutput = appName.toLowerCase() + ".css";

// Changelog file.
const changelogPath = "./CHANGELOG.md";

// Directory holding the assets.
const assetDir = "./assets";

// Directory holding the translations
const localeDir = "./locales";

// Directory with generated coverage info.
const coverageDir = "./coverage";

// Directory containing the sources
const srcDir = "./src";

// Destination directory for the bundler, copy every asset to this dir.
const outDir = "./http";

// The source directory for the HTTPS
// Server.
const serveDir = outDir;

// Path to HTTPS certificate and key
const httpsCertificate = "../https_cert.pem";
const httpsCertificateKey = "../https_cert-key.pem";

// HTTPS port to use
const httpsPort = 1234;

//==============================================================================
// JS requires

const { series, parallel, src, dest, watch } = require("gulp");

const { exec } = require("child_process");

const gExec = require("gulp-exec");

const del = require("delete");

const replace = require("gulp-string-replace");

const grename = require("gulp-rename");

const connect = require("gulp-connect");

const gulpEsbuild = require("gulp-esbuild");

const fs = require("fs");

const path = require("path");

const filelist = require("filelist");

const I18nextParser = require("i18next-parser").gulp;

//==============================================================================
// Generate a timestamp of the current date and time
function generateTimestamp() {
    function pad0s(n) {
        // eslint-disable-next-line no-magic-numbers
        return n < 10 ? "0" + n : n;
    }
    const nowDate = new Date();

    return (
        nowDate.getFullYear() +
        // eslint-disable-next-line no-magic-numbers
        pad0s(nowDate.getMonth() + 1) +
        pad0s(nowDate.getDate()) +
        pad0s(nowDate.getHours()) +
        pad0s(nowDate.getMinutes()) +
        pad0s(nowDate.getSeconds())
    );
}

//==============================================================================
// Replace Version and the PWA scope path.

function scanChangelogVersion() {
    let version = "";
    try {
        const data = fs.readFileSync(changelogPath, "utf8");
        const match = data
            .toString()
            .match(/##\s+Version\s+(?<versionMatch>[0-9]+.[0-9]+.[0-9]+)/u);
        version = match.groups.versionMatch;
    } catch (err) {
        console.log(err);
    }

    return version;
}

function processManifest(dirName, version, scopePath) {
    return src(dirName + "/" + manifestJSON)
        .pipe(
            replace(
                /"version":\s+"[0-9]+.[0-9]+.[0-9]+",/gu,
                `"version": "${version}",`
            )
        )
        .pipe(
            replace(/"start_url": "[\S]+",/gu, `"start_url": "${scopePath}",`)
        )
        .pipe(replace(/"id": "[\S]+",/gu, `"id": "${scopePath}",`))
        .pipe(replace(/"scope": "[\S]+",/gu, `"scope": "${scopePath}",`))
        .pipe(replace(/"action": "[\S]+",/gu, `"action": "${scopePath}",`))

        .pipe(dest(dirName));
}

function processManifestOutdirGitHub() {
    return processManifest(outDir, scanChangelogVersion(), navScopeGitHub);
}
function processManifestOutdir() {
    return processManifest(outDir, scanChangelogVersion(), navScopePWA);
}

//==============================================================================
// Replace the PWA scope path in index.html.
function processIndexHTML(scopePath) {
    const newUrlRex = new RegExp(
        `new URL\\("[\\S]+${serviceWorkerJS}", import\\.meta\\.url\\)`,
        "gu"
    );
    return src(outDir + "/index.html")
        .pipe(
            replace(
                newUrlRex,
                `new URL("${scopePath}${serviceWorkerJS}", import.meta.url)`
            )
        )
        .pipe(replace(/scope: "[\S]+",/gu, `scope: "${scopePath}",`))
        .pipe(dest(outDir));
}

function processIndexHTMLGitHub() {
    return processIndexHTML(navScopeGitHub);
}

function processIndexHTMLPWA() {
    return processIndexHTML(navScopePWA);
}

//==============================================================================
// Generate translation files.
function translate() {
    return src("src/**/*.ts")
        .pipe(
            new I18nextParser({
                namespaceSeparator: ":",
                keySeparator: ".",
                contextSeparator: "_",
                defaultNamespace: "translation",
                indentation: 2,
                pluralSeparator: "_",
                sort: false,
                verbose: true,
                locales: ["en", "de", "sk", "eo"],
                output: "locales/$LOCALE_$NAMESPACE.json",
            })
        )
        .pipe(dest("./"));
}

//==============================================================================
// Run tailwindcss.
async function runTailwind() {
    return (
        exec(
            `tailwindcss -c ${tailwindConfig} -i ${tailwindInput} -o ${outDir}/${tailwindOutput}`
        ),
        (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
        }
    );
}

//==============================================================================
// Start HTTPS server.
function runHTTPS(cb) {
    connect.server({
        root: serveDir,
        https: {
            key: fs.readFileSync(httpsCertificateKey),
            cert: fs.readFileSync(httpsCertificate),
        },
        host: "0.0.0.0",
        livereload: true,
        port: httpsPort,
    });
    cb();
}

//==============================================================================
// Return a list of all files in the directory `.http`, as a comma and newline
// Separated list.
function getListOfFiles(dir) {
    let listOfFiles = new filelist.FileList();
    listOfFiles.include(outDir + "/**");
    const outdirNoSlashes = outDir.replace(/^[./\\]*/gu, "");

    const addedFiles = listOfFiles
        .toArray()
        .filter((e) => !fs.statSync(e).isDirectory())
        .filter((e) => path.basename(e) !== serviceWorkerTS)
        .map((e) => '"' + e.replace(outdirNoSlashes + "/", dir) + '"')
        .concat([
            `"${dir}"`,
            `"${dir}${appJS}"`,
            `"${dir}${serviceWorkerJS}"`,
            `"${dir}${appJSMap}"`,
            `"${dir}${serviceWorkerJSMap}"`,
        ]);
    return [...new Set(addedFiles)];
}

//==============================================================================
// Copy service worker to ./http
function copyServiceWorker(dir) {
    const listOfFiles = getListOfFiles(dir);
    return src(serviceWorkerTSPath)
        .pipe(
            replace(
                /const manifest\s*=\s*\[\s*LIST_OF_FILES\s*\]/gu,
                "const manifest = [\n" + listOfFiles + "\n]"
            )
        )
        .pipe(
            replace(
                /const version\s*=\s*TIMESTAMP/gu,
                `const version = "${appName}-` + generateTimestamp() + '"'
            )
        )
        .pipe(dest(outDir));
}

function copyServiceWorkerGitHub() {
    return copyServiceWorker(navScopeGitHub);
}

function copyServiceWorkerNavScopePWA() {
    return copyServiceWorker(navScopePWA);
}

//==============================================================================
// Run Esbuild von JS files.
function processJS(file, destF) {
    return src(file)
        .pipe(
            gulpEsbuild({
                outfile: destF,
                bundle: true,
                sourcemap: "external",
                minify: true,
                target: "es2015",
                treeShaking: true,
                platform: "browser",
                resolveExtensions: [".ts"],
                define: {
                    "process.env.NODE_ENV": "production",
                },
            })
        )
        .pipe(dest(outDir))
        .pipe(connect.reload());
}

function processSW() {
    return processJS(outDir + "/" + serviceWorkerTS, serviceWorkerJS);
}

function processApp() {
    return processJS(srcDir + "/" + appTS, appJS);
}

//==============================================================================
// Watch for changes
function watchSource(cb) {
    watch("./src/**/*.ts", { ignoreInitial: false }, bundleTarget);
    cb();
}

//==============================================================================
// Copy everything in ./assets and ./locales to ./http
function copyDir(dir, destPath) {
    return src(dir + "/**/*").pipe(dest(outDir + destPath));
}

function copyAssets() {
    return copyDir(assetDir, "");
}

function copyLocales() {
    return copyDir(localeDir, "/locales");
}

//==============================================================================
// Delete generated files.
function delDirectory(dirName, cb) {
    return del([dirName], cb);
}

function cleanHTTP(cb) {
    return delDirectory(outDir, cb);
}

function cleanCoverage(cb) {
    return delDirectory(coverageDir, cb);
}

function deleteCopiedTSFiles(cb) {
    return del([`${outDir}/*.ts`], cb);
}

const cleanTarget = parallel(cleanHTTP, cleanCoverage);

const bundleTarget = series(
    parallel(copyAssets, copyLocales, runTailwind),
    parallel(
        processManifestOutdir,
        processIndexHTMLPWA,
        series(processApp, copyServiceWorkerNavScopePWA, processSW)
    ),
    deleteCopiedTSFiles
);

const bundleTargetGitHub = series(
    parallel(copyAssets, copyLocales, runTailwind),
    parallel(
        processManifestOutdirGitHub,
        processIndexHTMLGitHub,
        series(processApp, copyServiceWorkerGitHub, processSW)
    ),
    deleteCopiedTSFiles
);

const serveTarget = series(runHTTPS);

const translateTarget = series(translate);

exports.translate = translateTarget;

exports.clean = cleanTarget;

exports.bundle = bundleTarget;

exports.bundleGitHub = bundleTargetGitHub;

exports.serve = serveTarget;

exports.tailwind = series(runTailwind);

exports.watch = parallel(watchSource, serveTarget);
