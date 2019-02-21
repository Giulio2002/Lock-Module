export interface LinkableContract {
    evm: {
        bytecode: {
            object: any;
        };
    };
}
export declare function linkSolidity4(contract: LinkableContract, libraryName: string, libraryAddress: string): void;
export declare function linkSolidity5(contract: LinkableContract, libraryName: string, libraryAddress: string): void;
