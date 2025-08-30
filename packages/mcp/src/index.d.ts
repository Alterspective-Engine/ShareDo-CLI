/**
 * @sharedo/mcp - Model Context Protocol server for ShareDo platform
 *
 * Provides MCP server implementation for AI tools:
 * - ShareDo API access through MCP tools
 * - Workflow operations
 * - Template management
 * - Export functionality
 */
export interface IMCPServer {
    name: string;
    version: string;
    start(): Promise<void>;
    stop(): Promise<void>;
}
export interface IMCPTool {
    name: string;
    description: string;
    inputSchema: any;
    handler: (params: any) => Promise<any>;
}
export declare class ShareDoMCPServer implements IMCPServer {
    readonly name = "sharedo-mcp-server";
    readonly version = "1.0.0";
    private tools;
    private running;
    constructor();
    start(): Promise<void>;
    stop(): Promise<void>;
    private registerDefaultTools;
    private registerTool;
}
export default ShareDoMCPServer;
