const express = require('express');
const app = express();
app.use(express.json());
app.use((err, req, res, next)=>{
  if(err){
    return res.status(400).json(response("Invalid JSON payload passed.", "error", null));
  }else{
    next();
  }
})

let response =( message, status, data={}) => ({  message: message, status: status, data: data}); 
let validation = (error, field, field_value, condition, condition_value)=>({validation:{error: error, field: field,field_value: field_value, condition: condition, condition_value: condition_value}});
class NumberComparism{
  static eq(a,b){
    return a===b
  }
  static gt(a,b){
    return a > b
  }
  static gte(a,b){
    return a>=b
  }
  static neq(a,b){
    return a!==b
  }
  
}
class StringComparism{
  static CompareWords(a,b){
    let result = a.localeCompare(b);
    return result;
  }
  static Contains(a,b){
    return a.includes(b);
  }
}
function trimObj(obj) {
  if (!Array.isArray(obj) && typeof obj != 'object') return obj;
  return Object.keys(obj).reduce(function(acc, key) {
    acc[key.trim()] = typeof obj[key] == 'string'? obj[key].trim() : trimObj(obj[key]);
    return acc;
  }, Array.isArray(obj)? []:{});
}
let conditionList = ["eq","neq","gt","gte","contains"];

let responseType = (val)=>{
  if(Array.isArray(val)) return "Array";
  if(val === null) return "null"
  let type = typeof(val);
  if(type === "object" && val !== null) return "Object"
  if(type == "string") {
    return typeof(val.toString().trim());
  }
  return type;

}

app.get('/', (req, res)=>{
    return res.send(response("My Rule-Validation API", "success", {name: "Aigbodioh Emike", github: "@testrungirl", email:"laigbodioh@gmail.com", mobile:"09032295947",twitter:""}));

});

app.post('/validate-rule', (req, res)=>{
  try{

  let body =trimObj(JSON.parse(JSON.stringify(req.body)));
  let payloadList = Object.keys(body);

    if (!body.hasOwnProperty('rule') && !body.hasOwnProperty('data') || payloadList.length > 2){
      return res.status(400).json(response("Invalid JSON payload passed.", "error", null));
    }
    else if(!body.hasOwnProperty('rule')){
      return res.status(400).json(response("rule is required.", "error", null));
    }
    else if(!body.hasOwnProperty('data')){
      return res.status(400).json(response("data is required.", "error", null));
    }
    let ruleType = responseType(body.rule);
    let dataType = responseType(body.data);
    if(ruleType != "Object") return res.status(400).json(response("rule should be an object.","error",null));
    
    if(body.rule.hasOwnProperty('field') && body.rule.hasOwnProperty('condition') && body.rule.hasOwnProperty('condition_value')){
       
      if(dataType == "Object" || dataType == "Array" || dataType=="string"){
        let validRule= false;
        
        let listOfRuleValues = Object.values(body.rule).map((x)=>x);
        
        if(!(listOfRuleValues[0] != null && listOfRuleValues[0] && responseType(listOfRuleValues[0]) == "string")){
          return res.status(400).json(response("Invalid JSON payload passed.", "error", null));
        }
        if(!(listOfRuleValues[2] != null && listOfRuleValues[2] && (responseType(listOfRuleValues[2]) == "string"||responseType(listOfRuleValues[2]) =="number" ))){
          return res.status(400).json(response("Invalid JSON payload passed.", "error", null));
        }
        if(!(listOfRuleValues[1] != null && listOfRuleValues[1] && responseType(listOfRuleValues[1]) == "string" && conditionList.indexOf(listOfRuleValues[1]) >=0 )){
          return res.status(400).json(response("Invalid JSON payload passed.","error",null));
        }
        if(!(body.data)){
          return res.status(400).json(response("Invalid JSON payload passed.", "error", null));
        }
        let processedFields = body.rule.field.split(".").map(x=>x = x.trim()).filter(x=>x!="");
        if(processedFields.length > 2) return res.status(400).json(response("Invalid JSON payload passed.", "error", null));
        //console.log(body.data[processedFields[0]])
        if(body.data[processedFields[0]]){
          let condition = body["rule"]["condition"];
          let dataField = {};
          if(body.data[processedFields[0]][processedFields[1]]){
            if(condition == "gte"){
              validRule = NumberComparism.gte(body.data[processedFields[0]][processedFields[1]],body["rule"]["condition_value"]);
            }else if(condition == "gt"){
              validRule = NumberComparism.gt(body.data[processedFields[0]][processedFields[1]],body["rule"]["condition_value"]);
            }else if(condition == "neq"){
              validRule = NumberComparism.neq(body.data[processedFields[0]][processedFields[1]],body["rule"]["condition_value"]);
            }
            else if(condition == "eq"){
              validRule = NumberComparism.eq(body.data[processedFields[0]][processedFields[1]],body["rule"]["condition_value"]);
            }
            if(condition == "contains"){
              let value = StringComparism.Contains((body.data[processedFields[0]][processedFields[1]]).toString(), (body["rule"]["condition_value"]).toString());
              
              if(value){
                dataField = validation(false,body.rule.field, body.data[processedFields[0]][processedFields[1]], condition, body["rule"]["condition_value"])
              return res.status(200).json(response(`field ${body.rule.field} successfully validated.`, "success",dataField));
              }
              dataField = validation(true, body.rule.field, body.data[processedFields[0]][processedFields[1]], condition, body["rule"]["condition_value"])
              return res.status(400).json(response(`field ${body.rule.field} failed validation.`, "error", dataField));

            }
            
            if(validRule){
            dataField = validation(false,body.rule.field, body.data[processedFields[0]][processedFields[1]], condition, body["rule"]["condition_value"])
              return res.status(200).json(response(`field ${body.rule.field} successfully validated.`, "success",dataField));
            }else{
              dataField = validation(true, body.rule.field, body.data[processedFields[0]][processedFields[1]], condition, body["rule"]["condition_value"])
              return res.status(400).json(response(`field ${body.rule.field} failed validation.`, "error", dataField));
            }
            
              
            

          }
          // else if((body.data[processedFields[0]][processedFields[1]]) === undefined || (body.data[processedFields[0]][processedFields[1]]) === null){
          //   return res.status(400).json(response(`field ${body.data[processedFields[0]][processedFields[1]]} is missen from data.`, "error", null))
          // }
          else {
            if(condition == "gte"){
              validRule = NumberComparism.gte(body.data[processedFields[0]],body["rule"]["condition_value"]);
            }else if(condition == "gt"){
              validRule = NumberComparism.gt(body.data[processedFields[0]],body["rule"]["condition_value"]);
            }else if(condition == "neq"){
              validRule = NumberComparism.neq(body.data[processedFields[0]],body["rule"]["condition_value"]);
            }
            else if(condition == "eq"){
              validRule = NumberComparism.eq(body.data[processedFields[0]],body["rule"]["condition_value"]);
            }
            if(body["condition"] == "contains"){
              let value = StringComparism.Contains((body.data[processedFields[0]]).toString(), (body["rule"]["condition_value"]).toString());
              
              if(value){
                dataField = validation(false,body.rule.field, body.data[processedFields[0]], condition, body["rule"]["condition_value"])
              return res.status(200).json(response(`field ${body.rule.field} successfully validated.`, "success",dataField));
              }
              dataField = validation(true, body.rule.field, body.data[processedFields[0]], condition, body["rule"]["condition_value"])
              return res.status(400).json(response(`field ${body.rule.field} failed validation.`, "error", dataField));

            }
            if(validRule){
              dataField = validation(false,body.rule.field, body.data[processedFields[0]], condition, body["rule"]["condition_value"])
                return res.status(200).json(response(`field ${body.rule.field} successfully validated.`, "success",dataField));
              }
              dataField = validation(true, body.rule.field, body.data[processedFields[0]], condition, body["rule"]["condition_value"])
                return res.status(400).json(response(`field ${body.rule.field} failed validation.`, "error", dataField));
          }

        }
        return res.status(400).json(response(`field ${processedFields[0]} is missen from data.`, "error", null))
      }
      return res.status(400).json(response("data should be an object, array or a string.","error",null));
    }
    else{
      
      let message ="";
      let error_count = [];

      if(!body.rule.hasOwnProperty('field')){
        error_count.push('[rule.field]');
      }
      if(!body.rule.hasOwnProperty('condition')){
        error_count.push("[rule.condition]");
      }
      if(!body.rule.hasOwnProperty('condition_value')){
        error_count.push("[rule.condition_value]");
      }
      if(error_count.length == 3){
        message = `${error_count[0]}, ${error_count[1]}, and ${error_count[2]} are required.`;
      }else if(error_count.length == 2){
        message = `${error_count[0]} and ${error_count[1]} are required.`;
      }else{
        message = `${error_count[0]} is required.`;
      }
      //return res.send(message);
      
      return res.status(400).json(response(message, "error", null));
    }
  }
  catch(Exception ){
    return res.status(400).json(response("Invalid JSON payload passed.", "error", null));
  }
});
  
let port = process.env.Port || 3000;
app.listen(port, ()=> console.log(`Listening on port${port}...`))
