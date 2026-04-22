import fs from "fs";
import path from "path";
import { RenderPlugin } from "@11ty/eleventy";
import Nunjucks from "nunjucks";
import { extractExif } from "./_utils/exif.js";

export default function (eleventyConfig) {
    const nunjucksEnvironment = new Nunjucks.Environment(
        new Nunjucks.FileSystemLoader("_includes")
    );

    eleventyConfig.setLibrary("njk", nunjucksEnvironment);

    eleventyConfig.addPlugin(RenderPlugin);

    ["README.md", "LICENSE", "_includes/", "_templates/", ".github", "docs", "scss"].forEach((entry) => {
        eleventyConfig.ignores.add(entry);
    });

    eleventyConfig.setWatchThrottleWaitTime(100);
    eleventyConfig.addPassthroughCopy("LICENSE");

    ["assets/css/*.css", "assets/icons/*", "assets/img", "assets/fonts/*", "js/*.js"].forEach((entry) => {
        eleventyConfig.addPassthroughCopy(entry);
    });

    eleventyConfig.addShortcode("year", () => `2020 &mdash; ${new Date().getFullYear()}`);

    // Load and enhance photographs data with EXIF information.
    // Keep this under a separate key so curated _data/photographs.json remains the primary source.
    eleventyConfig.addGlobalData("photos", (() => {
        try {
            const curatedPath = path.join(process.cwd(), "_data", "photographs.json");
            const imagesDir = path.join(process.cwd(), "assets", "img", "photography");
            const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];

            const resolvePhotoPath = (photoId) => {
                for (const extension of imageExtensions) {
                    const filePath = path.join(imagesDir, `${photoId}${extension}`);
                    if (fs.existsSync(filePath)) {
                        return { filePath, extension: extension.replace(".", "") };
                    }
                }

                // Fallback for existing behavior if no matching file is found.
                return {
                    filePath: path.join(imagesDir, `${photoId}.jpg`),
                    extension: "jpg",
                };
            };

            if (!fs.existsSync(curatedPath)) {
                return [];
            }

            const curatedRaw = fs.readFileSync(curatedPath, "utf-8");
            const curated = JSON.parse(curatedRaw);

            // Enhance each entry with EXIF data
            let enhanced = curated.map((entry) => {
                const resolvedPhoto = resolvePhotoPath(entry.photoId);
                const fullImagePath = resolvedPhoto.filePath;

                const exifData = extractExif(fullImagePath);

                // Merge: curated data takes precedence, EXIF fills gaps
                const merged = {
                    ...entry,
                    imageExtension: entry.imageExtension || resolvedPhoto.extension,
                };

                if (exifData) {
                    merged.exif = exifData;
                    if (exifData.exifRaw) {
                        merged.exifRaw = exifData.exifRaw;
                    }
                }

                return merged;
            });

            // Sort by exif.dateTimeOriginal, newest first
            enhanced = enhanced.sort((a, b) => {
                const aDate = a.exif?.dateTimeOriginal || "";
                const bDate = b.exif?.dateTimeOriginal || "";
                if (aDate && bDate) {
                    return bDate.localeCompare(aDate);
                } else if (aDate) {
                    return -1;
                } else if (bDate) {
                    return 1;
                } else {
                    return 0;
                }
            });

            return enhanced;
        } catch (error) {
            console.error("Error loading photographs data:", error.message);
            return [];
        }
    })());

    const inferImageGroupFromTags = (tags) => {
        const tagList = Array.isArray(tags) ? tags : (typeof tags === "string" ? [tags] : []);
        if (tagList.includes("projects")) return "projects";
        if (tagList.includes("photographs")) return "photography";
        if (tagList.includes("showcases")) return "showcase";
        return "";
    };

    const buildAssetImagePath = (imagePath = "", extension = "", group = "", tags = [], size = "") => {
        if (!imagePath) return "";

        let normalizedImagePath = String(imagePath).replace(/^\/+/, "");
        const imageExtensionPattern = /\.(avif|gif|jpe?g|png|svg|webp)$/i;

        if (normalizedImagePath.startsWith("assets/img/")) {
            return `/${normalizedImagePath}`;
        }

        const resolvedGroup = group || inferImageGroupFromTags(tags);
        const normalizedSize = String(size || "").trim();

        if (normalizedSize && resolvedGroup === "projects" && !normalizedImagePath.includes("/")) {
            normalizedImagePath = `${normalizedImagePath}/${normalizedImagePath}`;
        }

        if (normalizedSize) {
            if (imageExtensionPattern.test(normalizedImagePath)) {
                normalizedImagePath = normalizedImagePath.replace(imageExtensionPattern, `-${normalizedSize}$&`);
            } else {
                normalizedImagePath = `${normalizedImagePath}-${normalizedSize}`;
            }
        }

        const hasFileExtension = imageExtensionPattern.test(normalizedImagePath);
        const pathWithGroup = resolvedGroup
            ? `${resolvedGroup}/${normalizedImagePath}`
            : normalizedImagePath;

        if (hasFileExtension || !extension) {
            return `/assets/img/${pathWithGroup}`;
        }

        const normalizedExtension = String(extension).replace(/^\./, "");
        return `/assets/img/${pathWithGroup}.${normalizedExtension}`;
    };

    eleventyConfig.addShortcode("assetImagePath", buildAssetImagePath);
    eleventyConfig.addFilter("assetImagePath", buildAssetImagePath);

    eleventyConfig.addFilter("readFile", (filePath) => {
        const fullPath = path.join(process.cwd(), filePath);
        return fs.readFileSync(fullPath, "utf-8");
    });

    eleventyConfig.addFilter("fileExists", (filePath, joinPath = "_includes") => {
        const fullPath = path.join(joinPath, filePath);
        return fs.existsSync(fullPath);
    });

    eleventyConfig.addFilter("safe", (content) => {
        return new Nunjucks.runtime.SafeString(content);
    });

    eleventyConfig.addFilter("dateISO", (date) => {
        return new Date(date).toISOString();
    });

    // Auto-link URLs in text
    eleventyConfig.addFilter("autoLinkUrls", (text) => {
        if (!text) return text;
        const urlRegex = /((https?:\/\/|www\.)[\w\-._~:/?#[\]@!$&'()*+,;=%]+)/gi;
        return text.replace(urlRegex, (url) => {
            let href = url;
            if (!href.startsWith("http")) href = "https://" + href;
            return `<a href="${href}" class="link-halo" rel="noopener" target="_blank">${url}</a>`;
        });
    });

    eleventyConfig.addFilter("breakLines", (text) => {
        if (!text) return text;
        return text.replace(/\n/g, "</p><p class=\"fs-6 mt-3 text-break\">");
    });

    eleventyConfig.on("eleventy.before", ({ runMode }) => {
        if (runMode !== "build") return;

        const outputDir = path.join(process.cwd(), "_site");
        if (fs.existsSync(outputDir)) {
            fs.rmSync(outputDir, { recursive: true, force: true });
            console.log("Cleaned _site directory.");
        }
    });

    const pagesDir = path.join(process.cwd(), "pages");
    const pageEntries = fs.readdirSync(pagesDir).filter((entry) => {
        return fs.lstatSync(path.join(pagesDir, entry)).isFile();
    });
    const pageNames = pageEntries.map((entry) => path.parse(entry).name);

    eleventyConfig.addCollection("groupPages", (collectionApi) => {
        return pageNames.map((pageName) => {
            const pageItems = collectionApi.getFilteredByGlob(`./pages/${pageName}.*`);
            return {
                pageGroup: pageName,
                pageEntries: pageItems,
                permalink: `/${pageName}/`,
            };
        });
    });

    pageNames.forEach((pageName) => {
        eleventyConfig.addCollection(pageName, (collectionApi) => {
            return collectionApi.getFilteredByGlob(`./pages/${pageName}.*`);
        });
    });

    const sortByTitle = (a, b) => {
        return (a.data.title || "").localeCompare(b.data.title || "");
    };

    const getPhotoLikeTitle = (item) => {
        return item.data.pageHeading || item.data.title || item.data.photo?.pageHeading || item.data.photo?.title || "";
    };

    const sortByPhotoLikeTitle = (a, b) => {
        return getPhotoLikeTitle(a).localeCompare(getPhotoLikeTitle(b));
    };

    const sortByOrderThenTitle = (a, b) => {
        const aOrder = a.data.order ?? Number.MAX_SAFE_INTEGER;
        const bOrder = b.data.order ?? Number.MAX_SAFE_INTEGER;

        if (aOrder !== bOrder) {
            return aOrder - bOrder;
        }

        return sortByTitle(a, b);
    };

    eleventyConfig.addCollection("projects", (collectionApi) => {
        return collectionApi.getFilteredByTag("projects").sort(sortByTitle);
    });

    eleventyConfig.addCollection("featuredProjects", (collectionApi) => {
        return collectionApi
            .getFilteredByTag("projects")
            .filter((item) => item.data.featured)
            .sort(sortByTitle);
    });

    eleventyConfig.addCollection("photographs", (collectionApi) => {
        return collectionApi.getFilteredByTag("photographs").sort(sortByPhotoLikeTitle);
    });

    eleventyConfig.addCollection("featuredPhotographs", (collectionApi) => {
        return collectionApi
            .getFilteredByTag("photographs")
            .filter((item) => item.data.featured || item.data.photo?.featured)
            .sort(sortByPhotoLikeTitle);
    });

    eleventyConfig.addCollection("showcases", (collectionApi) => {
        return collectionApi.getFilteredByTag("showcases").sort(sortByOrderThenTitle);
    });

    eleventyConfig.addCollection("featuredShowcases", (collectionApi) => {
        return collectionApi
            .getFilteredByTag("showcases")
            .filter((item) => item.data.featured)
            .sort(sortByOrderThenTitle);
    });

    const contentPermalinkRoots = {
        projects: "projects",
        photography: "photography",
        showcase: "about",
    };

    const getCollectionPermalink = (inputPath) => {
        const normalizedInputPath = inputPath.replace(/\\/g, "/");

        for (const [sourceDir, outputDir] of Object.entries(contentPermalinkRoots)) {
            if (!normalizedInputPath.includes(`/${sourceDir}/`) && !normalizedInputPath.startsWith(`${sourceDir}/`)) {
                continue;
            }

            const relativePath = normalizedInputPath.replace(new RegExp(`^.*?${sourceDir}/`), "");
            const permalinkPath = relativePath.replace(/\.[^/.]+$/, "");

            if (permalinkPath === "index") {
                return `/${outputDir}/`;
            }

            return `/${outputDir}/${permalinkPath}/`;
        }

        return null;
    };

    const isWithinDir = (inputPath, dirName) => {
        return inputPath.includes(`${dirName}/`);
    };

    const getPagesPermalink = (inputPath) => {
        const relativePath = inputPath.replace(/^.*\/pages\//, "");
        const permalinkPath = relativePath.replace(/\.[^/.]+$/, "");
        const normalizedPath = permalinkPath.replace(/\/index$/, "");
        return `/${normalizedPath}/`;
    };

    const getChangelogPermalink = (fileSlug) => {
        return `/changelog/${fileSlug}/`;
    };

    const getPageGroupData = (data, key) => {
        if (!data.collections || !data.collections.groupPages) {
            return null;
        }

        return data.collections.groupPages.find((group) => group.pageGroup === key) || null;
    };

    const getPhotoFallbackValue = (data, targetKey, photoKeys) => {
        if (!data.photo || data[targetKey]) {
            return data[targetKey];
        }

        for (const photoKey of photoKeys) {
            if (data.photo[photoKey]) {
                return data.photo[photoKey];
            }
        }

        return data[targetKey];
    };

    // Automatically set permalinks for content sections, flat pages content, and changelog items.
    eleventyConfig.addGlobalData("eleventyComputed", {
        permalink: (data) => {
            if (data.customPermalink) {
                return data.customPermalink; // Use custom permalink if provided
            }

            // Keep explicit front matter permalinks on paginated templates.
            if (data.pagination && data.permalink) {
                return data.permalink;
            }

            const collectionPermalink = getCollectionPermalink(data.page.inputPath);
            if (collectionPermalink) {
                return collectionPermalink;
            }

            if (isWithinDir(data.page.inputPath, "pages")) {
                return getPagesPermalink(data.page.inputPath);
            }

            if (isWithinDir(data.page.inputPath, "changelog")) {
                return getChangelogPermalink(data.page.fileSlug);
            }

            return data.permalink; // Keep existing permalink for other files
        },
        description: (data) => {
            if (isWithinDir(data.page.inputPath, "changelog")) {
                const date = new Date(data.date);
                return `Released on ${date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                })}`;
            }
            return data.description; // Keep existing description for other pages
        },
        title: (data) => {
            return getPhotoFallbackValue(data, "title", ["title", "pageHeading"]);
        },
        pageHeading: (data) => {
            return getPhotoFallbackValue(data, "pageHeading", ["pageHeading", "title"]);
        },
        featured: (data) => {
            if (data.photo && typeof data.featured === "undefined") {
                return Boolean(data.photo.featured);
            }
            return data.featured;
        },
        photoId: (data) => {
            return getPhotoFallbackValue(data, "photoId", ["photoId", "slug"]);
        },
        photoUrl: (data) => {
            return getPhotoFallbackValue(data, "photoUrl", ["photoUrl"]);
        },
        imageAlt: (data) => {
            return getPhotoFallbackValue(data, "imageAlt", ["imageAlt"]);
        },
        summary: (data) => {
            return getPhotoFallbackValue(data, "summary", ["summary"]);
        },
        pageGroup: (data) => {
            if (isWithinDir(data.page.inputPath, "pages")) {
                return data.page.fileSlug;
            }

            if (data.page.fileSlug && data.collections && data.collections.groupPages) {
                const pageGroupData = getPageGroupData(data, data.page.fileSlug);
                return pageGroupData ? pageGroupData.pageGroup : null;
            }

            return data.pageGroup;
        },
        pageEntries: (data) => {
            if (data.pageGroup) {
                const pageGroupData = getPageGroupData(data, data.pageGroup);
                return pageGroupData ? pageGroupData.pageEntries : [];
            }

            return [];
        },
        pageId: (data) => {
            if (data.page && data.page.fileSlug) {
                return data.page.fileSlug;
            }
            return null;
        },
    });

    return {
        templateFormats: ["njk", "md", "html"],
        markdownTemplateEngine: "njk",
        htmlTemplateEngine: "njk",
        dataTemplateEngine: "njk",
    };
}



