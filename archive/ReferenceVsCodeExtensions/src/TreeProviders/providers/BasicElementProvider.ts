import { ITreeProvider, ITreeDataService } from '../interfaces/ITreeProvider';
import { TreeNode } from '../../treeprovider';
import { ElementTypes } from '../../enums';

/**
 * Basic element provider that handles common tree node types
 * that don't require specialized domain logic
 */
export class BasicElementProvider implements ITreeProvider {
    private readonly basicElementTypes = [
        ElementTypes.folder,
        ElementTypes.folderItem,
        ElementTypes.info,
        ElementTypes.infos,
        ElementTypes.object
    ];

    constructor(private dataService: ITreeDataService) {}

    canHandle(elementType: ElementTypes): boolean {
        return this.basicElementTypes.includes(elementType);
    }

    async getChildren(element?: TreeNode): Promise<TreeNode[]> {
        if (!element) {
            return [];
        }

        const cacheKey = `basic_${element.type}_${element.entityId || 'root'}`;
        
        return this.dataService.fetchData(cacheKey, async () => {
            switch (element.type) {
                case ElementTypes.folder:
                case ElementTypes.folderItem:
                    return this.generateFolderNodes(element);
                case ElementTypes.info:
                case ElementTypes.infos:
                case ElementTypes.object:
                    return this.generateObjectNodes(element);
                default:
                    return [];
            }
        });
    }

    refresh(): void {
        this.dataService.invalidateCache('^basic_');
    }

    async preload(): Promise<void> {
        const commonKeys = [
            'basic_folder_root',
            'basic_object_root'
        ];
        await this.dataService.preloadData(commonKeys);
    }

    private async generateFolderNodes(element: TreeNode): Promise<TreeNode[]> {
        // Handle folder and folder item nodes
        if (element.children) {
            return element.children;
        }
        return [];
    }

    private async generateObjectNodes(element: TreeNode): Promise<TreeNode[]> {
        // Delegate to generic object helper
        const { generateObjectKeysInfoTreeNodes } = await import('../../Helpers/treeProviderHelper');
        return generateObjectKeysInfoTreeNodes(element.data, element);
    }
}
