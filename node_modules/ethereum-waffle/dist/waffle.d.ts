import { GanacheOpts } from 'ganache-core';
import { providers, Contract, Wallet } from 'ethers';
import defaultAccounts from './config/defaultAccounts';
import { LinkableContract } from './link';
import './matchers/matchertypes';
export declare function createMockProvider(ganacheOptions?: GanacheOpts): providers.Web3Provider;
export declare function getWallets(provider: providers.Provider): Wallet[];
interface ContractJSON {
    abi: any;
    evm: {
        bytecode: {
            object: any;
        };
    };
}
export declare function deployContract(wallet: Wallet, contractJSON: ContractJSON, args?: any[], overrideOptions?: providers.TransactionRequest): Promise<Contract>;
export declare const link: (contract: LinkableContract, libraryName: string, libraryAddress: string) => void;
export { defaultAccounts };
export declare const solidity: (chai: any, utils: any) => void;
declare type Fixture<T> = (provider: providers.Provider, wallets: Wallet[]) => Promise<T>;
export declare function createFixtureLoader(provider?: providers.Web3Provider, wallets?: Wallet[]): <T>(fixture: Fixture<T>) => Promise<T>;
export declare const loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
