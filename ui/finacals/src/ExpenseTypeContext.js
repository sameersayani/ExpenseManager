import {useState, createContext} from "react";
export const ExpenseTypeContext  = createContext();

export const ExpenseTypeProvider = (props) =>{
    const[expenseType, setexpenseType] = useState({"data": [] });
    return(
        <ExpenseTypeContext.Provider
         value ={[expenseType, setexpenseType]}>
            {props.children}
        </ExpenseTypeContext.Provider>
    );
}