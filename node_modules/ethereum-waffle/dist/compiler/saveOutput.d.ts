/// <reference types="node" />
import fs from 'fs';
import { Config } from '../config/config';
export interface BytecodeJson {
    linkReferences: object;
    object: string;
    opcodes: string;
    sourceMap: string;
}
export interface EvmJson {
    bytecode: BytecodeJson;
}
export interface ContractJson {
    interface: object[];
    abi: object[];
    bytecode: string;
    evm: EvmJson;
}
export declare function saveOutput(output: any, config: Config, filesystem?: typeof fs): Promise<void>;
