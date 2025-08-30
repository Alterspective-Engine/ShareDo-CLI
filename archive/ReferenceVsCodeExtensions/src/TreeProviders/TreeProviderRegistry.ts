import { ElementTypes } from '../enums';
import { ITreeProvider } from './interfaces/ITreeProvider';

export class TreeProviderRegistry {
    private providers = new Map<ElementTypes, ITreeProvider>();
    private wildcardProviders: ITreeProvider[] = [];

    register(elementType: ElementTypes, provider: ITreeProvider): void {
        this.providers.set(elementType, provider);
    }

    registerWildcard(provider: ITreeProvider): void {
        this.wildcardProviders.push(provider);
    }

    getProvider(elementType: ElementTypes): ITreeProvider | undefined {
        // Try exact match first
        const provider = this.providers.get(elementType);
        if (provider) {
            return provider;
        }

        // Try wildcard providers
        return this.wildcardProviders.find(p => p.canHandle(elementType));
    }

    canHandle(elementType: ElementTypes): boolean {
        return this.getProvider(elementType) !== undefined;
    }

    refreshAll(): void {
        for (const provider of this.providers.values()) {
            provider.refresh();
        }
        for (const provider of this.wildcardProviders) {
            provider.refresh();
        }
    }

    async preloadAll(): Promise<void> {
        const preloadPromises: Promise<void>[] = [];
        
        for (const provider of this.providers.values()) {
            if (provider.preload) {
                preloadPromises.push(provider.preload());
            }
        }
        
        for (const provider of this.wildcardProviders) {
            if (provider.preload) {
                preloadPromises.push(provider.preload());
            }
        }

        await Promise.allSettled(preloadPromises);
    }

    getProviderCount(): number {
        return this.providers.size + this.wildcardProviders.length;
    }

    getRegisteredTypes(): ElementTypes[] {
        return Array.from(this.providers.keys());
    }
}
