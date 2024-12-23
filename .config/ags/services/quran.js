import Service from 'resource:///com/github/Aylur/ags/service.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
import GLib from 'gi://GLib';
import _userOptions from '../modules/.configuration/user_options.js';

class QuranService extends Service {
    static {
        Service.register(
            this,
            {
                'error': ['string'],
                'surah-received': ['string'],
                'history-updated': ['jsobject'],
                'search-results': ['jsobject'],
            },
        );
    }

    _baseUrl = 'https://api.alquran.cloud/v1';
    _currentRequest = null;
    _recentSurahs = [];
    _maxHistory = 3;
    _scrollPositions = {};
    _verses = null;

    constructor() {
        super();
        
        // Load recent surahs and scroll positions from file
        this._loadHistory();
        this._loadScrollPositions();
        this._loadVersesFromCache();
    }

    _getHistoryPath() {
        return `${GLib.get_user_cache_dir()}/ags/quran_history.json`;
    }

    _getScrollPositionsPath() {
        return `${GLib.get_user_cache_dir()}/ags/quran_scroll_positions.json`;
    }

    _loadScrollPositions() {
        try {
            const path = this._getScrollPositionsPath();
            if (Utils.readFile(path)) {
                this._scrollPositions = JSON.parse(Utils.readFile(path));
            }
        } catch (error) {
            console.error('Error loading scroll positions:', error);
        }
    }

    _saveScrollPositions() {
        try {
            const path = this._getScrollPositionsPath();
            Utils.writeFile(JSON.stringify(this._scrollPositions), path);
        } catch (error) {
            console.error('Error saving scroll positions:', error);
        }
    }

    saveScrollPosition(surahNumber, position) {
        this._scrollPositions[surahNumber] = position;
        this._saveScrollPositions();
    }

    getScrollPosition(surahNumber) {
        return this._scrollPositions[surahNumber] || 0;
    }

    _loadHistory() {
        try {
            const historyPath = this._getHistoryPath();
            if (Utils.readFile(historyPath)) {
                this._recentSurahs = JSON.parse(Utils.readFile(historyPath));
                this.emit('history-updated', this._recentSurahs);
            }
        } catch (error) {
            console.error('Error loading Quran history:', error);
        }
    }

    _saveHistory() {
        try {
            const historyPath = this._getHistoryPath();
            Utils.writeFile(JSON.stringify(this._recentSurahs), historyPath);
            this.emit('history-updated', this._recentSurahs);
        } catch (error) {
            console.error('Error saving Quran history:', error);
        }
    }

    addToHistory(surahNumber, surahName) {
        // Remove if already exists
        this._recentSurahs = this._recentSurahs.filter(s => s.number !== surahNumber);
        
        // Add to front
        this._recentSurahs.unshift({
            number: surahNumber,
            name: surahName,
            timestamp: new Date().toISOString(),
        });
        
        // Keep only last N
        if (this._recentSurahs.length > this._maxHistory) {
            this._recentSurahs = this._recentSurahs.slice(0, this._maxHistory);
        }
        
        this._saveHistory();
    }

    getRecentSurahs() {
        return this._recentSurahs;
    }

    getSurahName(number) {
        const surahNames = {
            1: "الفَاتِحَة",
            2: "البَقَرَة",
            3: "آل عِمرَان",
            4: "النِّسَاء",
            5: "المَائِدَة",
            6: "الأَنعَام",
            7: "الأَعرَاف",
            8: "الأَنفَال",
            9: "التَّوبَة",
            10: "يُونس",
            // Add more Surah names...
        };
        return surahNames[number] || "";
    }

    getVerseNumberStyle(number) {
        try {
            const style = _userOptions.value?.modules?.quran?.verseNumberStyle || 'circle';
            const num = parseInt(number);
            switch (style) {
                case 'circle':
                    return `⟨${num}⟩`;
                case 'brackets':
                    return `⟦${num}⟧`;
                case 'square':
                    return `〖${num}〗`;
                default:
                    return `${num}.`;
            }
        } catch (error) {
            console.error('Error getting verse style:', error);
            return `${number}.`; // Fallback to simple format
        }
    }

    async _loadAllVerses() {
        if (this._verses) {
            console.log('Verses already loaded, count:', this._verses.length);
            return;
        }

        try {
            // Create cache directory if it doesn't exist
            const cacheDir = `${Utils.CACHE_DIR}/quran`;
            console.log('Creating cache directory:', cacheDir);
            Utils.mkdirSync(cacheDir);

            // Get complete Quran in one request
            const url = `${this._baseUrl}/quran/ar.asad`;
            console.log('Loading Quran from:', url);
            const cmd = ['curl', '-s', url];
            const result = await Utils.execAsync(cmd);
            
            if (!result) {
                throw new Error('Could not connect to Quran API');
            }

            console.log('Got response, length:', result.length);
            const data = JSON.parse(result);
            console.log('Parsed response:', data?.code, data?.status);

            if (!data?.data?.surahs) {
                console.error('Invalid API response:', data);
                throw new Error('Invalid API response format');
            }

            // Convert to verses array
            const allVerses = [];
            data.data.surahs.forEach(surah => {
                const chapterNum = surah.number;
                surah.ayahs.forEach(ayah => {
                    allVerses.push({
                        chapter_number: chapterNum,
                        verse_number: ayah.numberInSurah,
                        verse_key: `${chapterNum}:${ayah.numberInSurah}`,
                        text_uthmani: ayah.text
                    });
                });
            });

            if (allVerses.length === 0) {
                throw new Error('No verses were loaded');
            }

            this._verses = allVerses;
            console.log('Successfully loaded all verses:', this._verses.length);
            
            // Cache the verses to a file
            const cachePath = `${Utils.CACHE_DIR}/quran/verses.json`;
            console.log('Writing cache to:', cachePath);
            await Utils.writeFile(JSON.stringify(allVerses), cachePath);
            console.log('Cache written successfully');

            return true;
        } catch (error) {
            console.error('Error loading all verses:', error);
            this.emit('error', 'Failed to load Quran data: ' + error.message);
            return false;
        }
    }

    async _loadVersesFromCache() {
        try {
            const cachePath = `${Utils.CACHE_DIR}/quran/verses.json`;
            console.log('Checking cache at:', cachePath);
            const cacheExists = await Utils.fileExists(cachePath);
            console.log('Cache exists:', cacheExists);
            
            if (cacheExists) {
                console.log('Loading verses from cache');
                const cacheContent = await Utils.readFile(cachePath);
                console.log('Cache content length:', cacheContent.length);
                
                if (!cacheContent) {
                    console.error('Empty cache file');
                    return false;
                }

                try {
                    this._verses = JSON.parse(cacheContent);
                    if (!Array.isArray(this._verses) || this._verses.length === 0) {
                        console.error('Invalid cache content');
                        return false;
                    }
                    console.log('Loaded', this._verses.length, 'verses from cache');
                    return true;
                } catch (error) {
                    console.error('Failed to parse cache:', error);
                    return false;
                }
            }
        } catch (error) {
            console.error('Error loading verses from cache:', error);
        }
        
        console.log('Cache not found or error, loading from API');
        return this._loadAllVerses();
    }

    async searchQuran(query) {
        console.log('Searching for:', query);
        
        if (!this._verses) {
            console.log('Verses not loaded, loading now...');
            const loaded = await this._loadVersesFromCache();
            if (!loaded) {
                console.error('Failed to load verses');
                this.emit('error', 'Failed to load Quran data for search');
                return;
            }
        }

        if (!this._verses || !Array.isArray(this._verses)) {
            console.error('Invalid verses data:', this._verses);
            this.emit('error', 'Invalid Quran data');
            return;
        }

        console.log('Searching through', this._verses.length, 'verses');
        
        // For Arabic text, we'll do a direct comparison without normalization
        const results = this._verses.filter(verse => {
            try {
                if (!verse?.text_uthmani) {
                    console.log('Invalid verse:', verse);
                    return false;
                }

                // For Arabic text, do direct comparison
                const matches = verse.text_uthmani.includes(query);
                if (matches) {
                    console.log('Found match in verse:', verse.verse_key, verse.text_uthmani);
                }
                return matches;
            } catch (error) {
                console.error('Error matching verse:', error, verse);
                return false;
            }
        }).slice(0, 10);

        console.log('Found', results.length, 'results');
        
        if (results.length > 0) {
            console.log('First result:', results[0]);
        } else {
            console.log('Sample verses:', this._verses.slice(0, 2));
        }

        this.emit('search-results', results);
    }

    async fetchSurah(surahNumber) {
        try {
            // Cancel any ongoing request
            if (this._currentRequest === surahNumber) {
                return; // Already fetching this surah
            }
            this._currentRequest = surahNumber;

            const url = `${this._baseUrl}/surah/${surahNumber}/ar.asad`;
            
            const cmd = ['curl', '-s', '-H', 'Accept: application/json', '-H', 'User-Agent: Mozilla/5.0', url];
            const result = await Utils.execAsync(cmd);
            
            // Check if this request is still current
            if (this._currentRequest !== surahNumber) {
                return;
            }

            if (!result) {
                throw new Error('No response from server');
            }

            const data = JSON.parse(result);
            
            if (!data?.data?.ayahs) {
                console.error('Invalid response:', data);
                this.emit('error', 'Invalid response format from server');
                return;
            }

            if (data.data.ayahs.length === 0) {
                this.emit('error', `No verses found for Surah ${surahNumber}`);
                return;
            }

            let fullText = '';
            data.data.ayahs.forEach((ayah, index) => {
                const verseKey = `${surahNumber}:${ayah.numberInSurah}`;
                const verseText = ayah.text;
                const numberWithSpacing = ` ${this.getVerseNumberStyle(ayah.numberInSurah)} `;
                
                if (index === 0) {
                    // Add Surah name
                    const surahName = this.getSurahName(surahNumber);
                    if (surahName) {
                        fullText = `سورة ${surahName}\n\n`;
                        // Add to history
                        this.addToHistory(surahNumber, surahName);
                    }
                    // Add Bismillah for all Surahs except At-Tawbah (9)
                    if (surahNumber !== 9) {
                        fullText += 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\n\n';
                    }
                    fullText += verseText + numberWithSpacing;
                } else {
                    fullText += verseText + numberWithSpacing;
                }
            });
            
            this.emit('surah-received', fullText);
        } catch (error) {
            console.error('Fetch error:', error);
            this.emit('error', 'Failed to fetch surah. Please try again.');
        } finally {
            if (this._currentRequest === surahNumber) {
                this._currentRequest = null;
            }
        }
    }
}

const service = new QuranService();
export default service;
