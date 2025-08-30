import { ITreeProvider, ITreeDataService } from '../interfaces/ITreeProvider';
import { TreeNode } from '../../treeprovider';
import { ElementTypes } from '../../enums';

export class WorkTypeTreeProvider implements ITreeProvider {
    private readonly workTypeElementTypes = [
        ElementTypes.workTypes,
        ElementTypes.workType,
        ElementTypes.workTypeAspects,
        ElementTypes.workTypeAspect,
        ElementTypes.workTypeAspectSection
    ];

    constructor(private dataService: ITreeDataService) {}

    canHandle(elementType: ElementTypes): boolean {
        return this.workTypeElementTypes.includes(elementType);
    }

    async getChildren(element?: TreeNode): Promise<TreeNode[]> {
        if (!element) {
            return [];
        }

        const cacheKey = `worktype_${element.type}_${element.entityId || 'root'}`;
        
        return this.dataService.fetchData(cacheKey, async () => {
            switch (element.type) {
                case ElementTypes.workTypes:
                    return this.generateWorkTypesNodes(element);
                case ElementTypes.workType:
                    return this.generateWorkTypeNodes(element);
                case ElementTypes.workTypeAspects:
                    return this.generateWorkTypeAspectsNodes(element);
                case ElementTypes.workTypeAspect:
                    return this.generateWorkTypeAspectNodes(element);
                case ElementTypes.workTypeAspectSection:
                    return this.generateWorkTypeAspectSectionNodes(element);
                default:
                    return [];
            }
        });
    }

    refresh(): void {
        this.dataService.invalidateCache('^worktype_');
    }

    async preload(): Promise<void> {
        const commonKeys = [
            'worktype_workTypes_root',
            'worktype_workType_active'
        ];
        await this.dataService.preloadData(commonKeys);
    }

    private async generateWorkTypesNodes(element: TreeNode): Promise<TreeNode[]> {
        // Implementation for work types nodes - delegate to existing helpers
        const { generateWorkTypeRootTreeNodes } = await import('../../TreeHelpers/WorkTypesTreeProviderHelper');
        return generateWorkTypeRootTreeNodes(element);
    }

    private async generateWorkTypeNodes(element: TreeNode): Promise<TreeNode[]> {
        // Implementation for work type nodes - delegate to existing helpers
        const { generateWorkTypeTreeNodes } = await import('../../TreeHelpers/WorkTypesTreeProviderHelper');
        return generateWorkTypeTreeNodes(element);
    }

    private async generateWorkTypeAspectsNodes(element: TreeNode): Promise<TreeNode[]> {
        // Implementation for work type aspects nodes
        // This would need to be implemented based on the specific work type aspects structure
        return [];
    }

    private async generateWorkTypeAspectNodes(element: TreeNode): Promise<TreeNode[]> {
        // Implementation for work type aspect nodes
        // This would need to be implemented based on the specific work type aspect structure
        return [];
    }

    private async generateWorkTypeAspectSectionNodes(element: TreeNode): Promise<TreeNode[]> {
        // Implementation for work type aspect section nodes
        // This would need to be implemented based on the specific work type aspect section structure
        return [];
    }
}
