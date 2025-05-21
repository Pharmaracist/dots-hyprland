pragma Singleton
pragma ComponentBehavior: Bound

import "root:/modules/common"
import Quickshell;
import Quickshell.Io;
import Qt.labs.platform
import QtQuick;

Singleton {
    id: root
    property Component booruResponseDataComponent: BooruResponseData {}

    signal tagSuggestion(string query, var suggestions)

    property string failMessage: qsTr("That didn't work. Tips:\n- Check your tags and NSFW settings\n- If you don't have a tag in mind, type a page number")
    property var responses: []
    property int runningRequests: 0
    property var defaultUserAgent: ConfigOptions?.networking?.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    property var providerList: ["wallhaven", "yandere", "konachan", "zerochan", "danbooru", "gelbooru", "waifu.im"]
    property var providers: {
        "system": { "name": qsTr("System") },
        "wallhaven": {
            "name": "Wallhaven",
            "url": "https://wallhaven.cc",
            "api": "https://wallhaven.cc/api/v1/search",
            "description": qsTr("High quality wallpapers | CC licensed images"),
            "constructUrl": function(tags, nsfw, limit, page) {
                let url = "https://wallhaven.cc/api/v1/search"
                let params = []
                
                // Handle special category tags
                let specialCategory = "";
                let useSpecialCategory = true;
                let remainingTags = [];
                
                if (tags && tags.length > 0) {
                    // Check for special category tags
                    tags.forEach(tag => {
                        const lowerTag = tag.toLowerCase();
                        if (lowerTag === "toplist" || lowerTag === "top") {
                            specialCategory = "toplist";
                            useSpecialCategory = true;
                        } else if (lowerTag === "hot") {
                            specialCategory = "hot";
                            useSpecialCategory = true;
                        } else if (lowerTag === "latest") {
                            specialCategory = "latest";
                            useSpecialCategory = true;
                        } else if (lowerTag === "random") {
                            specialCategory = "random";
                            useSpecialCategory = true;
                        } else if (lowerTag === "best" || lowerTag === "favorites") {
                            specialCategory = "best";
                            useSpecialCategory = true;
                        } else {
                            remainingTags.push(tag);
                        }
                    });
                    
                    // Add remaining tags as search query
                    if (remainingTags.length > 0) {
                        params.push("q=" + encodeURIComponent(remainingTags.join(" ")));
                    }
                }
                
                // Handle purity settings (SFW/NSFW)
                // 100 = SFW, 010 = sketchy, 001 = NSFW
                params.push("purity=" + (nsfw ? "110" : "100"));
                
                // Add pagination
                params.push("page=" + page);
                
                // Set sorting based on special category
                if (useSpecialCategory) {
                    if (specialCategory === "toplist") {
                        params.push("sorting=toplist");
                        params.push("topRange=1M"); // 1 month toplist
                    } else if (specialCategory === "hot") {
                        params.push("sorting=hot");
                    } else if (specialCategory === "latest") {
                        params.push("sorting=date_added");
                        params.push("order=desc");
                    } else if (specialCategory === "random") {
                        params.push("sorting=random");
                    } else if (specialCategory === "best") {
                        params.push("sorting=toplist");
                        params.push("topRange=1y"); // Best of the year
                        params.push("atleast=1920x1080"); // High resolution only
                    }
                } else if (remainingTags.length > 0) {
                    // Use relevance for specific searches
                    params.push("sorting=relevance");
                } else {
                    // Default to toplist for general browsing
                    params.push("sorting=toplist");
                    params.push("topRange=1M"); // 1 month toplist
                }
                
                // Add other parameters
                params.push("ratios=landscape");
                params.push("categories=111"); // General, Anime, People
                
                // Combine URL
                return url + "?" + params.join("&");
            },
            "mapFunc": (response) => {
                // Check if response has the expected structure
                if (!response || !response.data) {
                    console.log("[Booru] Wallhaven response missing data property:", JSON.stringify(response))
                    return []
                }
                
                return response.data.map(item => {
                    return {
                        "id": item.id,
                        "width": parseInt(item.dimension_x) || 0,
                        "height": parseInt(item.dimension_y) || 0,
                        "aspect_ratio": (parseInt(item.dimension_x) && parseInt(item.dimension_y)) ? (parseInt(item.dimension_x) / parseInt(item.dimension_y)) : 1.0,
                        "tags": Array.isArray(item.tags) ? item.tags.map(tag => tag.name).join(' ') : "",
                        "rating": item.purity,
                        "is_nsfw": (item.purity !== 'sfw'),
                        "md5": item.id,
                        "preview_url": item.thumbs.small,
                        "sample_url": item.thumbs.original,
                        "file_url": item.path,
                        "file_ext": item.file_type ? item.file_type.split('/')[1] : "jpg",
                        "source": item.url,
                    }
                })
            },
            "tagSearchTemplate": "https://wallhaven.cc/api/v1/search?q={{query}}&sorting=relevance&categories=111&purity=100",
            "tagMapFunc": (response) => {
                // Check if response has the expected structure
                if (!response || !response.data || !Array.isArray(response.data)) {
                    console.log("[Booru] Wallhaven tag response missing data array:", JSON.stringify(response))
                    return []
                }
                
                // Extract unique tags from the results
                const tags = [];
                const tagSet = new Set();
                
                response.data.forEach(item => {
                    if (item.tags && Array.isArray(item.tags) && item.tags.length > 0) {
                        item.tags.forEach(tag => {
                            if (tag.name && !tagSet.has(tag.name)) {
                                tagSet.add(tag.name);
                                tags.push({
                                    "name": tag.name,
                                    "count": tag.category || 0
                                });
                            }
                        });
                    }
                });
                
                return tags;
            }
        },
        "yandere": {
            "name": "yande.re",
            "url": "https://yande.re",
            "api": "https://yande.re/post.json",
            "description": qsTr("All-rounder | Good quality, decent quantity"),
            "mapFunc": (response) => {
                return response.map(item => {
                    return {
                        "id": item.id,
                        "width": item.width,
                        "height": item.height,
                        "aspect_ratio": item.width / item.height,
                        "tags": item.tags,
                        "rating": item.rating,
                        "is_nsfw": (item.rating != 's'),
                        "md5": item.md5,
                        "preview_url": item.preview_url,
                        "sample_url": item.sample_url ?? item.file_url,
                        "file_url": item.file_url,
                        "file_ext": item.file_ext,
                        "source": getWorkingImageSource(item.source) ?? item.file_url,
                    }
                })
            },
            "tagSearchTemplate": "https://yande.re/tag.json?order=count&name={{query}}*",
            "tagMapFunc": (response) => {
                return response.map(item => {
                    return {
                        "name": item.name,
                        "count": item.count
                    }
                })
            }
        },
        "konachan": {
            "name": "Konachan",
            "url": "https://konachan.com",
            "api": "https://konachan.com/post.json",
            "description": qsTr("For desktop wallpapers | Good quality"),
            "mapFunc": (response) => {
                return response.map(item => {
                    return {
                        "id": item.id,
                        "width": item.width,
                        "height": item.height,
                        "aspect_ratio": item.width / item.height,
                        "tags": item.tags,
                        "rating": item.rating,
                        "is_nsfw": (item.rating != 's'),
                        "md5": item.md5,
                        "preview_url": item.preview_url,
                        "sample_url": item.sample_url ?? item.file_url,
                        "file_url": item.file_url,
                        "file_ext": item.file_ext,
                        "source": getWorkingImageSource(item.source) ?? item.file_url,
                    }
                })
            },
            "tagSearchTemplate": "https://konachan.com/tag.json?order=count&name={{query}}*",
            "tagMapFunc": (response) => {
                return response.map(item => {
                    return {
                        "name": item.name,
                        "count": item.count
                    }
                })
            }
        },
        "zerochan": {
            "name": "Zerochan",
            "url": "https://www.zerochan.net",
            "api": "https://www.zerochan.net/?json",
            "description": qsTr("Clean stuff | Excellent quality, no NSFW"),
            "mapFunc": (response) => {
                response = response.items
                return response.map(item => {
                    return {
                        "id": item.id,
                        "width": item.width,
                        "height": item.height,
                        "aspect_ratio": item.width / item.height,
                        "tags": item.tags.join(" "),
                        "rating": "safe", // Zerochan doesn't have nsfw
                        "is_nsfw": false,
                        "md5": item.md5,
                        "preview_url": item.thumbnail,
                        "sample_url": item.thumbnail,
                        "file_url": item.thumbnail,
                        "file_ext": "avif",
                        "source": getWorkingImageSource(item.source) ?? item.thumbnail,
                        "character": item.tag
                    }
                })
            }
        },
        "danbooru": {
            "name": "Danbooru",
            "url": "https://danbooru.donmai.us",
            "api": "https://danbooru.donmai.us/posts.json",
            "description": qsTr("The popular one | Best quantity, but quality can vary wildly"),
            "mapFunc": (response) => {
                return response.map(item => {
                    return {
                        "id": item.id,
                        "width": item.image_width,
                        "height": item.image_height,
                        "aspect_ratio": item.image_width / item.image_height,
                        "tags": item.tag_string,
                        "rating": item.rating,
                        "is_nsfw": (item.rating != 's'),
                        "md5": item.md5,
                        "preview_url": item.preview_file_url,
                        "sample_url": item.file_url ?? item.large_file_url,
                        "file_url": item.large_file_url,
                        "file_ext": item.file_ext,
                        "source": getWorkingImageSource(item.source) ?? item.file_url,
                    }
                })
            },
            "tagSearchTemplate": "https://danbooru.donmai.us/tags.json?search[name_matches]={{query}}*",
            "tagMapFunc": (response) => {
                return response.map(item => {
                    return {
                        "name": item.name,
                        "count": item.post_count
                    }
                })
            }

        },
        "gelbooru": {
            "name": "Gelbooru",
            "url": "https://gelbooru.com",
            "api": "https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1",
            "description": qsTr("The hentai one | Great quantity, a lot of NSFW, quality varies wildly"),
            "mapFunc": (response) => {
                response = response.post
                return response.map(item => {
                    return {
                        "id": item.id,
                        "width": item.width,
                        "height": item.height,
                        "aspect_ratio": item.width / item.height,
                        "tags": item.tags,
                        "rating": item.rating.replace('general', 's').charAt(0),
                        "is_nsfw": (item.rating != 's'),
                        "md5": item.md5,
                        "preview_url": item.preview_url,
                        "sample_url": item.sample_url ?? item.file_url,
                        "file_url": item.file_url,
                        "file_ext": item.file_url.split('.').pop(),
                        "source": getWorkingImageSource(item.source) ?? item.file_url,
                    }
                })
            },
            "tagSearchTemplate": "https://gelbooru.com/index.php?page=dapi&s=tag&q=index&json=1&orderby=count&name_pattern={{query}}%",
            "tagMapFunc": (response) => {
                return response.tag.map(item => {
                    return {
                        "name": item.name,
                        "count": item.count
                    }
                })
            }
        },
        "waifu.im": {
            "name": "waifu.im",
            "url": "https://waifu.im",
            "api": "https://api.waifu.im/search",
            "description": qsTr("Waifus only | Excellent quality, limited quantity"),
            "mapFunc": (response) => {
                response = response.images
                return response.map(item => {
                    return {
                        "id": item.image_id,
                        "width": item.width,
                        "height": item.height,
                        "aspect_ratio": item.width / item.height,
                        "tags": item.tags.map(tag => {return tag.name}).join(" "),
                        "rating": item.is_nsfw ? "e" : "s",
                        "is_nsfw": item.is_nsfw,
                        "md5": item.md5,
                        "preview_url": item.sample_url ?? item.url, // preview_url just says access denied (maybe i fucked up and sent too many requests idk)
                        "sample_url": item.url,
                        "file_url": item.url,
                        "file_ext": item.extension,
                        "source": getWorkingImageSource(item.source) ?? item.url,
                    }
                })
            },
            "tagSearchTemplate": "https://api.waifu.im/tags",
            "tagMapFunc": (response) => {
                return [...response.versatile.map(item => {return {"name": item}}), 
                    ...response.nsfw.map(item => {return {"name": item}})]
            }
        },
    }
    property var currentProvider: PersistentStates.booru.provider

    function getWorkingImageSource(url) {
        if (url.includes('pximg.net')) {
            return `https://www.pixiv.net/en/artworks/${url.substring(url.lastIndexOf('/') + 1).replace(/_p\d+\.(png|jpg|jpeg|gif)$/, '')}`;
        }
        return url;
    }
    
    function setProvider(provider) {
        provider = provider.toLowerCase()
        if (providerList.indexOf(provider) !== -1) {
            PersistentStateManager.setState("booru.provider", provider)
            root.addSystemMessage(qsTr("Provider set to ") + providers[provider].name
                + (provider == "zerochan" ? qsTr(". Notes for Zerochan:\n- You must enter a color\n- Set your zerochan username in `sidebar.booru.zerochan.username` config option. You [might be banned for not doing so](https://www.zerochan.net/api#:~:text=The%20request%20may%20still%20be%20completed%20successfully%20without%20this%20custom%20header%2C%20but%20your%20project%20may%20be%20banned%20for%20being%20anonymous.)!") : ""))
        } else {
            root.addSystemMessage(qsTr("Invalid API provider. Supported: \n- ") + providerList.join("\n- "))
        }
    }

    function clearResponses() {
        responses = []
    }

    function addSystemMessage(message) {
        responses = [...responses, root.booruResponseDataComponent.createObject(null, {
            "provider": "system",
            "tags": [],
            "page": -1,
            "images": [],
            "message": `${message}`
        })]
    }

    function constructRequestUrl(tags, nsfw=true, limit=20, page=1) {
        var provider = providers[currentProvider]
        
        // Use custom URL constructor for Wallhaven
        if (currentProvider === "wallhaven" && provider.constructUrl) {
            return provider.constructUrl(tags, nsfw, limit, page)
        }
        
        var baseUrl = provider.api
        var tagString = tags.join(" ")
        if (!nsfw && !(["zerochan", "waifu.im"].includes(currentProvider))) {
            if (currentProvider == "gelbooru") 
                tagString += " rating:general";
            else 
                tagString += " rating:safe";
        }
        var params = []
        // Tags & limit
        if (currentProvider === "zerochan") {
            params.push("c=" + tagString) // zerochan doesn't have search in api, so we use color
            params.push("l=" + limit)
            params.push("s=" + "fav")
            params.push("t=" + 1)
            params.push("p=" + page)
        }
        else if (currentProvider === "waifu.im") {
            var tagsArray = tagString.split(" ");
            tagsArray.forEach(tag => {
                params.push("included_tags=" + encodeURIComponent(tag));
            });
            params.push("limit=" + Math.min(limit, 30)) // Only admin can do > 30
            params.push("is_nsfw=" + (nsfw ? "null" : "false")) // null is random
        }
        else {
            params.push("tags=" + encodeURIComponent(tagString))
            params.push("limit=" + limit)
            if (currentProvider == "gelbooru") {
                params.push("pid=" + page)
            }
            else {
                params.push("page=" + page)
            }
        }
        var url = baseUrl
        if (baseUrl.indexOf("?") === -1) {
            url += "?" + params.join("&")
        } else {
            url += "&" + params.join("&")
        }
        return url
    }

    function makeRequest(tags, nsfw=false, limit=20, page=1) {
        var url = constructRequestUrl(tags, nsfw, limit, page)
        // console.log("[Booru] Making request to " + url)

        const newResponse = root.booruResponseDataComponent.createObject(null, {
            "provider": currentProvider,
            "tags": tags,
            "page": page,
            "images": [],
            "message": ""
        })

        var xhr = new XMLHttpRequest()
        xhr.open("GET", url)
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                try {
                    // console.log("[Booru] Raw response: " + xhr.responseText)
                    var response = JSON.parse(xhr.responseText)
                    response = providers[currentProvider].mapFunc(response)
                    // console.log("[Booru] Mapped response: " + JSON.stringify(response))
                    newResponse.images = response
                    newResponse.message = response.length > 0 ? "" : root.failMessage
                    
                } catch (e) {
                    console.log("[Booru] Failed to parse response: " + e)
                    newResponse.message = root.failMessage
                } finally {
                    root.runningRequests--;
                    root.responses = [...root.responses, newResponse]
                }
            }
            else if (xhr.readyState === XMLHttpRequest.DONE) {
                console.log("[Booru] Request failed with status: " + xhr.status)
            }
        }

        try {
            // Set appropriate headers for different providers
            if (currentProvider == "danbooru") {
                xhr.setRequestHeader("User-Agent", defaultUserAgent)
            }
            else if (currentProvider == "zerochan") {
                const userAgent = ConfigOptions?.sidebar?.booru?.zerochan?.username ? `Desktop sidebar booru viewer - username: ${ConfigOptions.sidebar.booru.zerochan.username}` : defaultUserAgent
                xhr.setRequestHeader("User-Agent", userAgent)
            }
            else if (currentProvider == "wallhaven") {
                // Wallhaven requires a User-Agent header
                xhr.setRequestHeader("User-Agent", defaultUserAgent)
            }
            
            // Log the request URL for debugging
            console.log("[Booru] Making request to: " + url)
            
            root.runningRequests++;
            xhr.send()
        } catch (error) {
            console.log("Could not set User-Agent:", error)
        } 
    }

    property var currentTagRequest: null
    function triggerTagSearch(query) {
        if (currentTagRequest) {
            currentTagRequest.abort();
        }

        var provider = providers[currentProvider]
        if (!provider.tagSearchTemplate) {
            return
        }
        var url = provider.tagSearchTemplate.replace("{{query}}", encodeURIComponent(query))

        var xhr = new XMLHttpRequest()
        currentTagRequest = xhr
        xhr.open("GET", url)
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                currentTagRequest = null
                try {
                    // console.log("[Booru] Raw response: " + xhr.responseText)
                    var response = JSON.parse(xhr.responseText)
                    response = provider.tagMapFunc(response)
                    // console.log("[Booru] Mapped response: " + JSON.stringify(response))
                    root.tagSuggestion(query, response)
                } catch (e) {
                    console.log("[Booru] Failed to parse response: " + e)
                }
            }
            else if (xhr.readyState === XMLHttpRequest.DONE) {
                console.log("[Booru] Request failed with status: " + xhr.status)
            }
        }

        try {
            // Required for danbooru
            if (currentProvider == "danbooru") {
                xhr.setRequestHeader("User-Agent", defaultUserAgent)
            }
            xhr.send()
        } catch (error) {
            console.log("Could not set User-Agent:", error)
        } 
    }
}

