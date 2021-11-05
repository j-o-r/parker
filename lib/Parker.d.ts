export default Parker;
export type ParkerPromise = {
    /**
     * - fail a promise
     */
    fail: Function;
    /**
     * - mark a promise successfull
     */
    done: Function;
    /**
     * - is the promise busy (not allready solved)
     */
    active: Function;
};
declare class Parker {
    /**
     * @param {boolean} [trace] - log progress of promise executions
     */
    constructor(trace?: boolean);
    /** @private */
    private trace;
    /** @private */
    private pOptions;
    /**
     * @param {...*} args
     */
    do(...args: any[]): any;
    /**
     * @param {...*} args
     */
    thenDo(...args: any[]): Parker;
    /**
     * @param {...*} args
     */
    orDo(...args: any[]): Parker;
    /**
     * Wait the execution of tasks for ms milliseconds
     *
     * @param {number} ms  - milliseconds
     */
    thenWait(ms: number): Parker;
    /**
     * @param {function} fn
     */
    whenDone(fn: Function): Parker;
    /**
     * @param {function} fn
     */
    whenException(fn: Function): Parker;
    /**
     * @param {function} fn
     */
    whenFail(fn: Function): Parker;
    /**
     * @private
     * @param {...*} args
     */
    private _registerPTasks;
    /**
     * @private
     */
    private reset;
    /**
     * @private
     */
    private execute;
    /**
     * Keep track of calls
     *
     * @private
     *
     * @param {string} status
     * @param {number} fnIndex
     * @param {number} thenLevel
     * @param {number} orLevel
     */
    private _PromiseReport;
    /**
     * @private
     */
    private _checkCurrentPLevel;
}
