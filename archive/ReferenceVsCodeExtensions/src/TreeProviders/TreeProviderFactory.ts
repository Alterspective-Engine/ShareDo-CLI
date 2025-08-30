import { CompositeTreeProvider } from './CompositeTreeProvider';
import { TreeDataService } from './services/TreeDataService';
import { TreeCache } from '../Utilities/TreeCache';

export class TreeProviderFactory {
    static createTreeProvider(useNewArchitecture: boolean = true): any {
        if (useNewArchitecture) {
            const cache = new TreeCache();
            // TreeDataService now creates its own performance monitor internally
            const dataService = new TreeDataService(cache);
            
            return new CompositeTreeProvider(dataService);
        } else {
            // Return the legacy TreeNodeProvider for backward compatibility
            const { TreeNodeProvider: legacyTreeNodeProvider } = require('../treeprovider');
            return new legacyTreeNodeProvider();
        }
    }

    static createLazyTreeProvider(): CompositeTreeProvider {
        // Future implementation for lazy loading version
        return TreeProviderFactory.createTreeProvider(true) as CompositeTreeProvider;
    }
}
