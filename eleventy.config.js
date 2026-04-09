import fs from "fs";
import path from "path";
import { RenderPlugin } from "@11ty/eleventy";
import Nunjucks from "nunjucks";

export default function (eleventyConfig) {
    let nunjucksEnvironment = new Nunjucks.Environment(
        new Nunjucks.FileSystemLoader("_includes")
    );

    eleventyConfig.setLibrary("njk", nunjucksEnvironment);

    eleventyConfig.addPlugin(RenderPlugin);

    eleventyConfig.ignores.add("README.md");
    eleventyConfig.ignores.add("LICENSE");
    eleventyConfig.ignores.add("_includes/");
    eleventyConfig.ignores.add("_templates/");
    eleventyConfig.ignores.add(".github");
    eleventyConfig.setWatchThrottleWaitTime(100);
    eleventyConfig.addPassthroughCopy("LICENSE");
    eleventyConfig.addPassthroughCopy("assets/css/*.css");
    eleventyConfig.addPassthroughCopy("assets/favicons/*");
    eleventyConfig.addPassthroughCopy("assets/img");
    eleventyConfig.addPassthroughCopy("assets/fonts/*");
    eleventyConfig.addPassthroughCopy("js/*.js");

    eleventyConfig.addTemplateFormats("md");
    eleventyConfig.addGlobalData("layout", "md.njk");

    eleventyConfig.addShortcode("year", () => `2020 &mdash; ${new Date().getFullYear()}`);

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

    eleventyConfig.addFilter('dateISO', (date) => {
        return new Date(date).toISOString();
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

    eleventyConfig.addCollection("projects", (collectionApi) => {
        return collectionApi.getFilteredByTag("projects").sort((a, b) => {
            return (a.data.title || "").localeCompare(b.data.title || "");
        });
    });

    eleventyConfig.addCollection("featuredProjects", (collectionApi) => {
        return collectionApi
            .getFilteredByTag("projects")
            .filter((item) => item.data.featured)
            .sort((a, b) => (a.data.title || "").localeCompare(b.data.title || ""));
    });

    eleventyConfig.addCollection("photographs", (collectionApi) => {
        return collectionApi.getFilteredByTag("photographs").sort((a, b) => {
            return (a.data.title || "").localeCompare(b.data.title || "");
        });
    });

    eleventyConfig.addCollection("featuredPhotographs", (collectionApi) => {
        return collectionApi
            .getFilteredByTag("photographs")
            .filter((item) => item.data.featured)
            .sort((a, b) => (a.data.title || "").localeCompare(b.data.title || ""));
    });

    eleventyConfig.addCollection("showcases", (collectionApi) => {
        return collectionApi.getFilteredByTag("showcases").sort((a, b) => {
            const aOrder = a.data.order ?? Number.MAX_SAFE_INTEGER;
            const bOrder = b.data.order ?? Number.MAX_SAFE_INTEGER;

            if (aOrder !== bOrder) {
                return aOrder - bOrder;
            }

            return (a.data.title || "").localeCompare(b.data.title || "");
        });
    });

    eleventyConfig.addCollection("featuredShowcases", (collectionApi) => {
        return collectionApi
            .getFilteredByTag("showcases")
            .filter((item) => item.data.featured)
            .sort((a, b) => {
                const aOrder = a.data.order ?? Number.MAX_SAFE_INTEGER;
                const bOrder = b.data.order ?? Number.MAX_SAFE_INTEGER;

                if (aOrder !== bOrder) {
                    return aOrder - bOrder;
                }

                return (a.data.title || "").localeCompare(b.data.title || "");
            });
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

    // Automatically set permalinks for content sections, flat pages content, and changelog items.
    eleventyConfig.addGlobalData("eleventyComputed", {
        permalink: (data) => {
            if (data.customPermalink) {
                return data.customPermalink; // Use custom permalink if provided
            }

            const collectionPermalink = getCollectionPermalink(data.page.inputPath);
            if (collectionPermalink) {
                return collectionPermalink;
            }

            if (data.page.inputPath.includes("pages/")) {
                // Remove 'pages/' from the input path and construct a slug-based permalink.
                const relativePath = data.page.inputPath.replace(/^.*\/pages\//, "");
                const permalinkPath = relativePath.replace(/\.[^/.]+$/, ""); // Remove file extension
                const normalizedPath = permalinkPath.replace(/\/index$/, "");
                return `/${normalizedPath}/`; // Ensure it ends with a trailing slash
            }
            if (data.page.inputPath.includes("changelog/")) {
                const versionSlug = data.page.fileSlug; // Use the file name (e.g., "2.0.0")
                return `/changelog/${versionSlug}/`; // Set the desired permalink
            }
            return data.permalink; // Keep existing permalink for other files
        },
        description: (data) => {
            if (data.page.inputPath.includes("changelog/")) {
                const date = new Date(data.date);
                return `Released on ${date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                })}`;
            }
            return data.description; // Keep existing description for other pages
        },
        pageGroup: (data) => {
            if (data.page.inputPath.includes("pages/")) {
                return data.page.fileSlug;
            }
            if (data.page.fileSlug && data.collections && data.collections.groupPages) {
                const pageGroupData = data.collections.groupPages.find(
                    (group) => group.pageGroup === data.page.fileSlug
                );
                return pageGroupData ? pageGroupData.pageGroup : null;
            }
            return data.pageGroup;
        },
        pageEntries: (data) => {
            if (data.pageGroup && data.collections && data.collections.groupPages) {
                const pageGroupData = data.collections.groupPages.find(
                    (group) => group.pageGroup === data.pageGroup
                );
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



