declare const overwriteBigNumberFunction: (functionName: string, readableName: string, _super: (...args: any[]) => any, chaiUtils: {
    flag: (...args: any[]) => any;
}) => (...args: any[]) => void;
export default overwriteBigNumberFunction;
