/**
 * Fun Cache Messages
 * 
 * Provides entertaining status messages for cache operations
 */

export class CacheFunMessages {
    private static startMessages = [
        "🧹 Sweeping away the old cache dust...",
        "🚀 Launching cache refresh sequence...",
        "🎭 Cache makeover in progress...",
        "🌪️ Whirlwind cache cleanup initiated...",
        "🎨 Painting fresh cache colors...",
        "🔄 Spinning up the cache refresh dance...",
        "🧙‍♂️ Casting cache refresh spell...",
        "🏃‍♂️ Cache is doing cardio...",
        "🚿 Giving the cache a nice shower...",
        "🎪 Cache circus performance starting...",
        "🎯 Targeting stale cache for elimination...",
        "🦸‍♂️ Cache superhero mode activated...",
        "🎮 Playing cache refresh mini-game...",
        "🍃 Spring cleaning the cache...",
        "⚡ Zapping old cache into oblivion..."
    ];

    private static successMessages = [
        "✨ Cache sparkles with freshness!",
        "🎉 Cache party successful! Everything's fresh!",
        "🌟 Cache is now squeaky clean!",
        "🏆 Achievement unlocked: Fresh Cache!",
        "🎊 Confetti! Cache refresh complete!",
        "💎 Cache now shines like a diamond!",
        "🌈 Rainbow cache activated!",
        "🎯 Bullseye! Cache perfectly refreshed!",
        "🚀 Cache has reached warp speed!",
        "🎨 Masterpiece! Cache beautifully refreshed!",
        "🏅 Gold medal cache performance!",
        "🎭 Cache gave a standing ovation!",
        "🦄 Magical cache transformation complete!",
        "🌺 Cache blooming with freshness!",
        "⚡ Lightning fast cache ready!"
    ];

    private static batchMessages = [
        "🎪 Cache juggling {count} operations like a pro!",
        "🎯 {count} cache targets eliminated!",
        "🎨 Painted {count} fresh cache canvases!",
        "🚀 Launched {count} cache rockets!",
        "🎉 {count} cache parties in one go!",
        "💫 {count} shooting stars of cache freshness!",
        "🏆 {count}x combo! Cache champion!",
        "🎭 {count} act cache performance complete!",
        "🌟 {count} stars aligned for perfect cache!",
        "🎊 {count} confetti cannons fired!"
    ];

    private static waitingMessages = [
        "⏳ Cache refresh brewing... {seconds}s",
        "🍳 Cooking fresh cache... {seconds}s",
        "🎬 Cache scene {seconds}... Action soon!",
        "⏰ T-minus {seconds} to cache freshness!",
        "🎪 Cache show starts in {seconds}s!",
        "🎨 Final cache touches in {seconds}s...",
        "🚦 Cache green light in {seconds}s...",
        "🎯 Aiming for cache perfection... {seconds}s"
    ];

    private static serverMessages: Map<string, string[]> = new Map([
        ['prod', [
            "🏢 Production cache: Handle with care!",
            "⚠️ Production refresh: Maximum caution engaged!",
            "🔐 Securing production cache refresh..."
        ]],
        ['demo', [
            "🎮 Demo cache: Ready for showtime!",
            "🎪 Demo cache: The show must go on!",
            "🎭 Demo cache: Preparing the stage..."
        ]],
        ['dev', [
            "🛠️ Dev cache: Breaking things responsibly!",
            "🔬 Dev cache: For science!",
            "🎨 Dev cache: Creative mode enabled!"
        ]],
        ['test', [
            "🧪 Test cache: Experiments in progress!",
            "🔍 Test cache: Under the microscope!",
            "📋 Test cache: Checking all the boxes!"
        ]]
    ]);

    /**
     * Get a random message from an array
     */
    private static getRandom(messages: string[]): string {
        return messages[Math.floor(Math.random() * messages.length)];
    }

    /**
     * Get start message
     */
    public static getStartMessage(): string {
        return this.getRandom(this.startMessages);
    }

    /**
     * Get success message
     */
    public static getSuccessMessage(): string {
        return this.getRandom(this.successMessages);
    }

    /**
     * Get batch message
     */
    public static getBatchMessage(count: number): string {
        const message = this.getRandom(this.batchMessages);
        return message.replace('{count}', count.toString());
    }

    /**
     * Get waiting message
     */
    public static getWaitingMessage(seconds: number): string {
        const message = this.getRandom(this.waitingMessages);
        return message.replace('{seconds}', seconds.toString());
    }

    /**
     * Get server-specific message
     */
    public static getServerMessage(serverUrl: string): string {
        // Try to identify server type from URL
        const urlLower = serverUrl.toLowerCase();
        
        for (const [key, messages] of this.serverMessages) {
            if (urlLower.includes(key)) {
                return this.getRandom(messages);
            }
        }
        
        // Default messages if no match
        return this.getRandom([
            "🌐 Cache refresh across the interwebs!",
            "🔗 Connecting to cache refresh central!",
            "📡 Beaming fresh cache from the cloud!"
        ]);
    }

    /**
     * Get failure message
     */
    public static getFailureMessage(): string {
        return this.getRandom([
            "😅 Oops! Cache got stage fright!",
            "🙈 Cache refresh took a coffee break!",
            "🎪 The cache circus hit a snag!",
            "🎭 Cache forgot its lines!",
            "🎯 Missed the cache target this time!",
            "🎨 Cache paint spilled! Try again?",
            "🚧 Cache construction zone - try again!",
            "🎮 Game over! Insert coin to retry cache!",
            "🦸‍♂️ Even superheroes need a second try!",
            "🌈 Rainbow machine needs recalibration!"
        ]);
    }

    /**
     * Get countdown sequence
     */
    public static getCountdownSequence(seconds: number): string {
        const sequences = [
            ["🚀", "🛸", "✨"],
            ["🎯", "🎪", "🎊"],
            ["🎨", "🖌️", "🌈"],
            ["⚡", "💫", "🌟"],
            ["🔮", "🎭", "🎉"]
        ];
        
        const sequence = sequences[Math.floor(Math.random() * sequences.length)];
        const icon = sequence[Math.min(3 - seconds, sequence.length - 1)];
        
        return `${icon} Cache refresh in ${seconds}...`;
    }

    /**
     * Get progress bar visualization
     */
    public static getProgressBar(current: number, total: number): string {
        const percentage = Math.round((current / total) * 100);
        const filled = Math.floor(percentage / 10);
        const empty = 10 - filled;
        
        const bar = "█".repeat(filled) + "░".repeat(empty);
        const icons = ["🌱", "🌿", "🌳", "🌲", "🎄"];
        const icon = icons[Math.min(Math.floor(percentage / 20), icons.length - 1)];
        
        return `${icon} [${bar}] ${percentage}% - ${current}/${total} files`;
    }

    /**
     * Get time-based message
     */
    public static getTimeBasedMessage(): string {
        const hour = new Date().getHours();
        
        if (hour >= 5 && hour < 12) {
            return this.getRandom([
                "☕ Morning cache refresh with coffee!",
                "🌅 Dawn of a fresh cache!",
                "🥐 Breakfast cache special!"
            ]);
        } else if (hour >= 12 && hour < 17) {
            return this.getRandom([
                "🌞 Afternoon cache siesta done!",
                "🍔 Lunch break cache refresh!",
                "☀️ Sunny cache disposition!"
            ]);
        } else if (hour >= 17 && hour < 21) {
            return this.getRandom([
                "🌆 Evening cache wind-down!",
                "🍕 Dinner time cache special!",
                "🌇 Sunset cache refresh!"
            ]);
        } else {
            return this.getRandom([
                "🌙 Midnight cache magic!",
                "⭐ Starlight cache refresh!",
                "🦉 Night owl cache update!"
            ]);
        }
    }

    /**
     * Get seasonal message
     */
    public static getSeasonalMessage(): string {
        const month = new Date().getMonth();
        
        if (month >= 2 && month <= 4) {
            // Spring
            return this.getRandom([
                "🌸 Spring cleaning the cache!",
                "🌷 Cache blooming beautifully!",
                "🦋 Cache metamorphosis complete!"
            ]);
        } else if (month >= 5 && month <= 7) {
            // Summer
            return this.getRandom([
                "☀️ Summer cache vibes!",
                "🏖️ Beach-fresh cache!",
                "🍉 Cool cache refresh!"
            ]);
        } else if (month >= 8 && month <= 10) {
            // Fall
            return this.getRandom([
                "🍂 Autumn cache colors!",
                "🎃 Spooky fast cache!",
                "🍁 Cache falling into place!"
            ]);
        } else {
            // Winter
            return this.getRandom([
                "❄️ Winter cache wonderland!",
                "⛄ Frosty fresh cache!",
                "🎅 Holiday cache magic!"
            ]);
        }
    }
}