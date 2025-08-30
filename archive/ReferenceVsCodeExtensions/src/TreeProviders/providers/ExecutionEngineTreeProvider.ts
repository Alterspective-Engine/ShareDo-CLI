import { ITreeProvider, ITreeDataService } from '../interfaces/ITreeProvider';
import { TreeNode } from '../../treeprovider';
import { ElementTypes } from '../../enums';

export class ExecutionEngineTreeProvider implements ITreeProvider {
    private readonly executionElementTypes = [
        ElementTypes.executionOverview,
        ElementTypes.executingPlans,
        ElementTypes.executingPlan,
        ElementTypes.executionStat,
        ElementTypes.planDetail,
        ElementTypes.subProcesses,
        ElementTypes.subProcess,
        ElementTypes.advisorIssues,
        ElementTypes.advisorIssue,
        ElementTypes.issueGroup
    ];

    constructor(private dataService: ITreeDataService) {}

    canHandle(elementType: ElementTypes): boolean {
        return this.executionElementTypes.includes(elementType);
    }

    async getChildren(element?: TreeNode): Promise<TreeNode[]> {
        if (!element) {
            return [];
        }

        const cacheKey = `execution_${element.type}_${element.entityId || 'root'}`;
        
        return this.dataService.fetchData(cacheKey, async () => {
            switch (element.type) {
                case ElementTypes.executionOverview:
                    return this.generateExecutionOverviewNodes(element);
                case ElementTypes.executingPlans:
                    return this.generateExecutingPlansNodes(element);
                case ElementTypes.executingPlan:
                    return this.generateExecutingPlanNodes(element);
                case ElementTypes.executionStat:
                    return this.generateExecutionStatNodes(element);
                case ElementTypes.planDetail:
                    return this.generatePlanDetailNodes(element);
                case ElementTypes.subProcesses:
                    return this.generateSubProcessesNodes(element);
                case ElementTypes.subProcess:
                    return this.generateSubProcessNodes(element);
                case ElementTypes.advisorIssues:
                    return this.generateAdvisorIssuesNodes(element);
                case ElementTypes.advisorIssue:
                    return this.generateAdvisorIssueNodes(element);
                case ElementTypes.issueGroup:
                    return this.generateIssueGroupNodes(element);
                default:
                    return [];
            }
        });
    }

    refresh(): void {
        this.dataService.invalidateCache('^execution_');
    }

    async preload(): Promise<void> {
        const commonKeys = [
            'execution_executionOverview_root',
            'execution_executingPlans_active'
        ];
        await this.dataService.preloadData(commonKeys);
    }

    private async generateExecutionOverviewNodes(element: TreeNode): Promise<TreeNode[]> {
        // Implementation for execution overview nodes - delegate to existing helpers
        const { generateExecutionMonitoringTreeNodes } = await import('../../TreeHelpers/ExecutionEngineTreeProviderHelper');
        return generateExecutionMonitoringTreeNodes(element);
    }

    private async generateExecutingPlansNodes(element: TreeNode): Promise<TreeNode[]> {
        // Implementation for executing plans nodes - use generic object generation for now
        const { generateObjectKeysInfoTreeNodes } = await import('../../Helpers/treeProviderHelper');
        return generateObjectKeysInfoTreeNodes(element.data, element);
    }

    private async generateExecutingPlanNodes(element: TreeNode): Promise<TreeNode[]> {
        // Implementation for executing plan nodes - use generic object generation for now
        const { generateObjectKeysInfoTreeNodes } = await import('../../Helpers/treeProviderHelper');
        return generateObjectKeysInfoTreeNodes(element.data, element);
    }

    private async generateExecutionStatNodes(element: TreeNode): Promise<TreeNode[]> {
        // Implementation for execution stat nodes
        // This would need to be implemented based on the specific execution stat structure
        return [];
    }

    private async generatePlanDetailNodes(element: TreeNode): Promise<TreeNode[]> {
        // Implementation for plan detail nodes
        // This would need to be implemented based on the specific plan detail structure
        return [];
    }

    private async generateSubProcessesNodes(element: TreeNode): Promise<TreeNode[]> {
        // Implementation for sub processes nodes
        // This would need to be implemented based on the specific sub processes structure
        return [];
    }

    private async generateSubProcessNodes(element: TreeNode): Promise<TreeNode[]> {
        // Implementation for sub process nodes
        // This would need to be implemented based on the specific sub process structure
        return [];
    }

    private async generateAdvisorIssuesNodes(element: TreeNode): Promise<TreeNode[]> {
        // Implementation for advisor issues nodes
        // This would need to be implemented based on the specific advisor issues structure
        return [];
    }

    private async generateAdvisorIssueNodes(element: TreeNode): Promise<TreeNode[]> {
        // Implementation for advisor issue nodes
        // This would need to be implemented based on the specific advisor issue structure
        return [];
    }

    private async generateIssueGroupNodes(element: TreeNode): Promise<TreeNode[]> {
        // Implementation for issue group nodes
        // This would need to be implemented based on the specific issue group structure
        return [];
    }
}
