

export interface IExecutionBaseResult<T>
{
    result: T| undefined;
    success: boolean;
    error: string | undefined;
    freindlyError: string| undefined;
    executionTime: number| undefined;
       
}