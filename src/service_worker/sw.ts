// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2022 Roland Csaszar
//
// Project:  typescript-test
// File:     sw.ts
// Date:     20.Feb.2022
//
// ==============================================================================

// Turn this into a module file.
export {};

// Default values of TIMESTAMP and LIST_OF_FILES, just to shut the TS compiler up.
const TIMESTAMP: string = "";
const LIST_OF_FILES: string = "";

// `version` is the name of the cache, including a timestamp.
// This is filled by `gulp bundle` when copying `sw.js` to the directory `http`.
const version = TIMESTAMP;
// `manifest` is an array holding the paths to all files to cache.
// This is changed against the real list of files by `gulp bundle` when copying
//`sw.js` to the directory `http`.
const manifest = [LIST_OF_FILES];

//==============================================================================
// Installation

/**
 * Install the service worker.
 * On installation, all files Parcel knows about are added to the cache.
 */
async function install() {
    const cache = await caches.open(version);
    await cache.addAll(manifest);
    console.warn(`[Service Worker] installed files to ${version}`);
}

addEventListener("install", (event: Event) => {
    const ev = event as ExtendableEvent;
    ev.waitUntil(install());
});

//==============================================================================
// Activation

/**
 * Activate service worker.
 * On activation all files from older versions of the cache are deleted.
 */
async function activate() {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => key !== version && caches.delete(key)));
    console.warn(`[Service Worker] activated`);
}

addEventListener("activate", (event: Event) => {
    const ev = event as ExtendableEvent;
    ev.waitUntil(activate());
});

//==============================================================================
// Fetching

/**
 * Fetches the given URL, either from cache or the server.
 *
 * @param {Request} request The request to fulfill.
 *
 * @returns {Response} The fetched URL as `Response`.
 */
async function fetchFromCache(request: Request) {
    const cachedResponse = await caches.match(request, { ignoreSearch: true });
    if (cachedResponse?.ok) {
        console.warn(`[Service Worker] cache hit: ${request.url}`);
        return cachedResponse;
    }
    console.warn(`[Service Worker] fetching ${request.url}`);

    const response = await fetch(request).catch(return404);
    if (response?.ok) {
        return response;
    }
    console.error(`[Service Worker] haven't found ${request.url}`);
    // eslint-disable-next-line i18next/no-literal-string
    return return404("URL not found");
}

addEventListener("fetch", (event) => {
    const ev = event as FetchEvent;
    fetchFromCache(ev.request).then((e) => ev.respondWith(e));
});

/**
 * Return the 404 error page.
 *
 * @param err - The error message to display.
 * @returns the 404 HTML page.
 */
async function return404(err: string): Promise<Response> {
    console.error(`[Service Worker] Error: "${err}"`);
    // eslint-disable-next-line i18next/no-literal-string
    const response = await caches.match("/404.html");
    if (response !== undefined) {
        return response;
    }
    return new Response();
}
