// sound2.js
const soundModule = (p) => {
    let testSound;
    let clickSound;
    let hoverSound;
    let muteIcon;
    let unmuteIcon;
    let assetsLoaded = false;
    let loadingErrors = [];

    const loadAssets = () => {
        console.log("🔊 sound2.js: Starting asset loading...");
        
        try {
            // Load background music tracks
            const backgroundTracks = ['test.wav', 'test2.wav'];
            let randomTrack = p.random(backgroundTracks);
            console.log(`🎵 Loading background track: ${randomTrack}`);
            
            testSound = p.loadSound(randomTrack, 
                () => {
                    console.log("✅ Background music loaded successfully");
                },
                (error) => {
                    console.error("❌ Background music failed to load:", error);
                    loadingErrors.push(`Background music: ${error}`);
                }
            );

            // Load click sound tracks
            const clickTracks = ['sound1.wav', 'sound4.wav'];
            let randomClickSound = p.random(clickTracks);
            console.log(`🎵 Loading click sound: ${randomClickSound}`);
            
            clickSound = p.loadSound(randomClickSound,
                () => {
                    console.log("✅ Click sound loaded successfully");
                },
                (error) => {
                    console.error("❌ Click sound failed to load:", error);
                    loadingErrors.push(`Click sound: ${error}`);
                }
            );

            // Load hover sound
            console.log("🎵 Loading hover sound: sound3.wav");
            hoverSound = p.loadSound('sound3.wav',
                () => {
                    console.log("✅ Hover sound loaded successfully");
                },
                (error) => {
                    console.error("❌ Hover sound failed to load:", error);
                    loadingErrors.push(`Hover sound: ${error}`);
                }
            );

            // Load icons
            console.log("🖼️ Loading mute/unmute icons...");
            muteIcon = p.loadImage('mute.png',
                () => {
                    console.log("✅ Mute icon loaded successfully");
                },
                (error) => {
                    console.error("❌ Mute icon failed to load:", error);
                    loadingErrors.push(`Mute icon: ${error}`);
                }
            );
            
            unmuteIcon = p.loadImage('unmute.png',
                () => {
                    console.log("✅ Unmute icon loaded successfully");
                },
                (error) => {
                    console.error("❌ Unmute icon failed to load:", error);
                    loadingErrors.push(`Unmute icon: ${error}`);
                }
            );

            // Check loading status after a delay
            setTimeout(() => {
                checkLoadingStatus();
            }, 2000);

        } catch (error) {
            console.error("❌ Error during asset loading:", error);
            loadingErrors.push(`General error: ${error}`);
        }
    };

    const checkLoadingStatus = () => {
        const loadedAssets = [];
        const failedAssets = [];

        if (testSound && testSound.isLoaded()) loadedAssets.push("Background music");
        else failedAssets.push("Background music");

        if (clickSound && clickSound.isLoaded()) loadedAssets.push("Click sound");
        else failedAssets.push("Click sound");

        if (hoverSound && hoverSound.isLoaded()) loadedAssets.push("Hover sound");
        else failedAssets.push("Hover sound");

        if (muteIcon) loadedAssets.push("Mute icon");
        else failedAssets.push("Mute icon");

        if (unmuteIcon) loadedAssets.push("Unmute icon");
        else failedAssets.push("Unmute icon");

        console.log(`📊 Asset loading summary:`);
        console.log(`✅ Loaded: ${loadedAssets.join(", ")}`);
        if (failedAssets.length > 0) {
            console.log(`❌ Failed: ${failedAssets.join(", ")}`);
        }

        assetsLoaded = failedAssets.length === 0;
        if (assetsLoaded) {
            console.log("🎉 All assets loaded successfully!");
        } else {
            console.log("⚠️ Some assets failed to load. Check console for details.");
        }
    };

    const playTestSound = () => {
        if (testSound && testSound.isLoaded() && !testSound.isPlaying()) {
            testSound.loop();
            console.log("🎵 Playing background music");
        } else if (!testSound) {
            console.log("⚠️ Background music not loaded yet");
        } else if (!testSound.isLoaded()) {
            console.log("⚠️ Background music still loading");
        } else if (testSound.isPlaying()) {
            console.log("ℹ️ Background music already playing");
        }
    };

    const stopTestSound = () => {
        if (testSound && testSound.isPlaying()) {
            testSound.stop();
            console.log("⏹️ Stopped background music");
        } else if (!testSound) {
            console.log("⚠️ Background music not loaded");
        } else if (!testSound.isPlaying()) {
            console.log("ℹ️ Background music not playing");
        }
    };

    const playClickSound = () => {
        if (clickSound && clickSound.isLoaded()) {
            clickSound.play();
            console.log("🖱️ Played click sound");
        } else if (!clickSound) {
            console.log("⚠️ Click sound not loaded");
        } else {
            console.log("⚠️ Click sound still loading");
        }
    };

    const playHoverSound = () => {
        if (hoverSound && hoverSound.isLoaded()) {
            hoverSound.play();
            console.log("🖱️ Played hover sound");
        } else if (!hoverSound) {
            console.log("⚠️ Hover sound not loaded");
        } else {
            console.log("⚠️ Hover sound still loading");
        }
    };

    const getLoadingStatus = () => {
        return {
            assetsLoaded,
            loadingErrors,
            backgroundMusic: testSound && testSound.isLoaded(),
            clickSound: clickSound && clickSound.isLoaded(),
            hoverSound: hoverSound && hoverSound.isLoaded(),
            icons: muteIcon && unmuteIcon
        };
    };

    return {
        loadAssets,
        playTestSound,
        stopTestSound,
        playClickSound,
        playHoverSound,
        getLoadingStatus,
        get testSound() { return testSound; },
        get clickSound() { return clickSound; },
        get hoverSound() { return hoverSound; },
        get muteIcon() { return muteIcon; },
        get unmuteIcon() { return unmuteIcon; },
        get isAssetsLoaded() { return assetsLoaded; }
    };
};