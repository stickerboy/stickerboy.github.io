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

    eleventyConfig.addCollection("groupPages", (collectionApi) => {
        const pagesDir = path.join(process.cwd(), "pages");
        const folders = fs.readdirSync(pagesDir).filter((file) => {
            return fs.lstatSync(path.join(pagesDir, file)).isDirectory();
        });

        return folders.map((folder) => {
            const folderItems = collectionApi.getFilteredByGlob(`./pages/${folder}/**/*.*`);
            return {
                folderName: folder,
                folderItems: folderItems,
                permalink: `/${folder}/`,
            };
        });
    });

    const pagesDir = path.join(process.cwd(), "pages");
    const folders = fs.readdirSync(pagesDir).filter((file) => {
        return fs.lstatSync(path.join(pagesDir, file)).isDirectory();
    });

    folders.forEach((folder) => {
        eleventyConfig.addCollection(folder, (collectionApi) => {
            return collectionApi.getFilteredByGlob(`./pages/${folder}/*.njk`);
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

    // Automatically set permalink for changelog items
    eleventyConfig.addGlobalData("eleventyComputed", {
        permalink: (data) => {
            if (data.customPermalink) {
                return data.customPermalink; // Use custom permalink if provided
            }
            if (data.page.inputPath.includes("pages/")) {
                // Remove 'pages/' from the input path and construct the permalink
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
        folderName: (data) => {
            if (data.page.inputPath.includes("pages/")) {
                const folderPath = data.page.inputPath.split("/").slice(-2, -1)[0];
                return folderPath;
            }
            if (data.page.fileSlug && data.collections && data.collections.groupPages) {
                const groupPage = data.collections.groupPages.find(
                    (group) => group.folderName === data.page.fileSlug
                );
                return groupPage ? groupPage.folderName : null;
            }
            return data.folderName;
        },
        folderItems: (data) => {
            if (data.folderName && data.collections && data.collections.groupPages) {
                const groupPage = data.collections.groupPages.find(
                    (group) => group.folderName === data.folderName
                );
                return groupPage ? groupPage.folderItems : [];
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



