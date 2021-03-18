export declare type Platform = 'win32' | 'darwin' | 'linux' | 'freebsd' | 'openbsd' | 'sunos';
export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface Screen extends Rect {
    index: number;
    scale: {
        x: number;
        y: number;
    };
}
export interface Response {
    title: string;
    id: number;
    bounds: Rect;
    screens: Screen[];
    owner: {
        name: string;
        processId: number;
        bundleId?: string;
        path: string;
    };
    memoryUsage?: number;
}
declare class WinInfo {
    static getByHid(hid: number): Promise<Response>;
    static getByPid(pid: number, platform?: Platform): Promise<Response>;
    static getActive(platform?: Platform): Promise<Response>;
    static getByHidSync(hid: number): Response;
    static getByPidSync(pid: number, platform?: Platform): Response;
    static getActiveSync(platform?: Platform): Response;
}
export declare const getByHid: typeof WinInfo.getByHid;
export declare const getByPid: typeof WinInfo.getByPid;
export declare const getByHidSync: typeof WinInfo.getByHidSync;
export declare const getByPidSync: typeof WinInfo.getByPidSync;
export declare const getActive: typeof WinInfo.getActive;
export declare const getActiveSync: typeof WinInfo.getActiveSync;
export {};
