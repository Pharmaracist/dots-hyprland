import QtQuick
import QtQuick.Controls
import Quickshell

QtObject {
    id: root

    // Properties for current state
    property var currentSurah: null
    property var currentAyah: null
    property var currentTranslation: null
    property bool loading: false
    property string error: ""
    // Cache for loaded surahs
    property var surahCache: ({
    })
    property var translationCache: ({
    })
    // API endpoints
    property string apiBase: "https://api.alquran.cloud/v1"

    // Signal when data is loaded
    signal dataLoaded()
    signal errorOccurred(string message)

    // Get list of all surahs
    function getSurahs() {
        loading = true;
        error = "";
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                loading = false;
                if (xhr.status === 200) {
                    var response = JSON.parse(xhr.responseText);
                    if (response.code === 200) {
                        currentSurah = response.data;
                        dataLoaded();
                    } else {
                        error = "Failed to load surahs: " + response.status;
                        errorOccurred(error);
                    }
                } else {
                    error = "Network error: " + xhr.status;
                    errorOccurred(error);
                }
            }
        };
        xhr.open("GET", apiBase + "/surah");
        xhr.send();
    }

    // Get specific surah
    function getSurah(number) {
        if (surahCache[number]) {
            currentSurah = surahCache[number];
            dataLoaded();
            return ;
        }
        loading = true;
        error = "";
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                loading = false;
                if (xhr.status === 200) {
                    var response = JSON.parse(xhr.responseText);
                    if (response.code === 200) {
                        surahCache[number] = response.data;
                        currentSurah = response.data;
                        dataLoaded();
                    } else {
                        error = "Failed to load surah: " + response.status;
                        errorOccurred(error);
                    }
                } else {
                    error = "Network error: " + xhr.status;
                    errorOccurred(error);
                }
            }
        };
        xhr.open("GET", apiBase + "/surah/" + number);
        xhr.send();
    }

    // Get translation for a surah
    function getTranslation(surahNumber, translationId = "en.asad") {
        var cacheKey = surahNumber + "_" + translationId;
        if (translationCache[cacheKey]) {
            currentTranslation = translationCache[cacheKey];
            dataLoaded();
            return ;
        }
        loading = true;
        error = "";
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                loading = false;
                if (xhr.status === 200) {
                    var response = JSON.parse(xhr.responseText);
                    if (response.code === 200) {
                        translationCache[cacheKey] = response.data;
                        currentTranslation = response.data;
                        dataLoaded();
                    } else {
                        error = "Failed to load translation: " + response.status;
                        errorOccurred(error);
                    }
                } else {
                    error = "Network error: " + xhr.status;
                    errorOccurred(error);
                }
            }
        };
        xhr.open("GET", apiBase + "/surah/" + surahNumber + "/" + translationId);
        xhr.send();
    }

    // Search in the Quran
    function search(query, page = 1, size = 20) {
        loading = true;
        error = "";
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                loading = false;
                if (xhr.status === 200) {
                    var response = JSON.parse(xhr.responseText);
                    if (response.code === 200) {
                        currentAyah = response.data;
                        dataLoaded();
                    } else {
                        error = "Search failed: " + response.status;
                        errorOccurred(error);
                    }
                } else {
                    error = "Network error: " + xhr.status;
                    errorOccurred(error);
                }
            }
        };
        xhr.open("GET", apiBase + "/search/" + encodeURIComponent(query) + "?page=" + page + "&size=" + size);
        xhr.send();
    }

}
