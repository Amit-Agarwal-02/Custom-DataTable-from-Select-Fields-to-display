public with sharing class dynamicDataTableController {

   @AuraEnabled
   public static String updateSelectedFields(String objectName, String fieldAPINames){
      String getNameFieldAPI = '';
      try{
         for(String str : fieldAPINames.split(',')){
            if(str.containsIgnoreCase('.Name')){
               if(str.containsIgnoreCase('__c.Name')){
                  getNameFieldAPI += str.Substring(0,str.length()-5) + ',' ;
               }else{
                  getNameFieldAPI += str.Substring(0,str.length()-5) + 'Id'+',' ;
               }
            }else{
               getNameFieldAPI += str+ ',' ;
            }
         }
         List<DataTableConfigurationObject__c> fieldAPINameStored = new List<DataTableConfigurationObject__c>();
         List<DataTableConfigurationObject__c> updatetableConfig = new List<DataTableConfigurationObject__c>();
         fieldAPINameStored = [SELECT Id,Name,ObjectAPIName__c,All_Field_API_Name__c FROM DataTableConfigurationObject__c WHERE ObjectAPIName__c =:objectName LIMIT 1]; 
         if(fieldAPINameStored.size() > 0){ 
            for(DataTableConfigurationObject__c dataconfg : fieldAPINameStored){
               DataTableConfigurationObject__c objDataTableConfig = new DataTableConfigurationObject__c();
               objDataTableConfig.All_Field_API_Name__c = getNameFieldAPI.removeEnd(',');
               objDataTableConfig.Id = dataconfg.Id ;
               objDataTableConfig.ObjectAPIName__c = objectName;
               updatetableConfig.add(objDataTableConfig);
            }         
         }else{
            DataTableConfigurationObject__c objDataTableConfig = new DataTableConfigurationObject__c();
            objDataTableConfig.All_Field_API_Name__c =  getNameFieldAPI.removeEnd(',');
            objDataTableConfig.ObjectAPIName__c = objectName;
            updatetableConfig.add(objDataTableConfig);
         }
         if(updatetableConfig.size() > 0){
            upsert updatetableConfig;
         }
         return 'Success';
      }catch(Exception ex){
         throw new AuraHandledException(ex.getMessage());
      }
   }

   @AuraEnabled
   public static List<SObject> retreieveRecords(String objectName, String fieldAPINames){
      String fieldApi = '';
      String getNameFieldAPI = '';
      for(String str : fieldAPINames.split(',')){
         if(str.containsIgnoreCase('__c.Name')){
            fieldApi = fieldApi + str.Substring(0,str.length()-5)+',';
         }else{
            fieldApi = fieldApi + str+ ',' ;
         }
      }
      fieldApi = fieldApi.removeEnd(',');
      String strQuery = 'SELECT ' + fieldApi + ' FROM ' + objectName ; //+ ' LIMIT 10' ;
      System.debug('database.query(strQuery) $$ '+database.query(strQuery) );   
      return database.query(strQuery);
   }

   //Retrieve field details based on Object API Name
   @AuraEnabled (cacheable=true)
   public static String retreieveFields(String ObjectName){
   
      MapFieldWrapperClass fieldMapWrap = new MapFieldWrapperClass();
      Map<String, String> existingmapField = new Map<String, String>();
      Map<String, String> newmapField = new Map<String, String>();
      Map<String, String> allmapField = new Map<String, String>();      
      
      Set<String> setFieldList  = new  Set<String>();
      List<String> fieldAPIList = new  List<String>();
      System.debug('ObjectName =>'+ObjectName );
      String RegEx ='<\\/?[^>]*>';
      if(!String.isEmpty(ObjectName)){
         List<DataTableConfigurationObject__c> fieldAPINameStored = [SELECT Id,Name,ObjectAPIName__c,All_Field_API_Name__c FROM DataTableConfigurationObject__c WHERE ObjectAPIName__c =:ObjectName];
         if(fieldAPINameStored.size() > 0 && fieldAPINameStored[0].All_Field_API_Name__c != null ){
            System.debug('existing data  fieldAPINameStored[0].All_Field_API_Name__c =>' + fieldAPINameStored[0].All_Field_API_Name__c);
            String unescapeString = fieldAPINameStored[0].All_Field_API_Name__c.replaceAll(RegEx, '');
            System.debug('Unescaped String: => '+unescapeString);
            for(String str : unescapeString.split(',')){
               fieldAPIList.add(str);
            }
            existingmapField = sobjectListField(fieldAPIList,ObjectName);
            System.debug('existing existingmapField $$ '+existingmapField);
            fieldMapWrap.selectedFieldsMap = sortFieldMapInAscending(existingmapField);
            System.debug('fieldMapWrap.selectedFieldsMap => '+fieldMapWrap.selectedFieldsMap );
         }
         System.debug('New data else block ' );
         SObjectType sObjType = ((SObject) Type.forName(ObjectName).newInstance()).getSObjectType();
         for(Schema.SObjectField fld: sObjType.getDescribe().fields.getMap().values()){
            if(fld.getDescribe().getType() == Schema.DisplayType.REFERENCE){
               allmapField.put(fld.getDescribe().getLabel().replaceAll('ID',''),fld.getDescribe().getRelationshipName() + '.Name');
            }else if(fld.getDescribe().getCalculatedFormula() != null && fld.getDescribe().getCalculatedFormula().containsIgnoreCase('hyperlink')){
               allmapField.put(fld.getDescribe().getLabel(),fld.getDescribe().getName() + '.Name');
            }else if(fld.getDescribe().getName() != 'Id'){
               allmapField.put(fld.getDescribe().getLabel(),fld.getDescribe().getName());
            }
         }
         fieldMapWrap.allAvailableFieldsMap = sortFieldMapInAscending(allmapField);
         System.debug('fieldMapWrap.allAvailableFieldsMap => '+fieldMapWrap.allAvailableFieldsMap );
      }
      return JSON.serialize(fieldMapWrap);
   }

   public static  Map<String, String> sortFieldMapInAscending(Map<String, String> mapField){
      Map<String, String> sortedMap = new Map<String, String>();
      List<String> fieldlabelList = new List<String>(); 
      fieldlabelList.addAll(mapField.keySet());  
      fieldlabelList.sort();
      for (Integer i = (fieldlabelList.size() - 1); i >= 0; i--){
         sortedMap.put(fieldlabelList[i], mapField.get(fieldlabelList[i]));
         // System.debug('fieldlabelList ' + i + ' $$' + fieldlabelList[i] + ' == '+ mapField.get(fieldlabelList[i]));
      }
      System.debug('new sortedMap =>' + sortedMap);
      return sortedMap;
   }

   public static Map<String, String> sobjectListField(List<String> fieldList,String ObjectName){
      System.debug('fieldList $$ '+fieldList);
      System.debug('ObjectName $$ '+ObjectName);
      Schema.DescribeSObjectResult objDescribe = Schema.getGlobalDescribe().get(ObjectName).getDescribe();
      Map<String, String> newmapField = new Map<String, String>();
      for(String sfld: fieldList){
         System.debug('Schema.SObjectField Label $$ '+ objDescribe.fields.getMap().get(sfld).getDescribe().getLabel());
         System.debug('sfld $$ '+sfld);
         Schema.DescribeFieldResult fieldResult = objDescribe.fields.getMap().get(sfld).getDescribe();
         if(fieldResult.getType() == Schema.DisplayType.REFERENCE){
            newmapField.put(fieldResult.getLabel().replaceAll('ID',''),fieldResult.getRelationshipName() + '.Name');
         }else if(fieldResult.getCalculatedFormula() != null && fieldResult.getCalculatedFormula().containsIgnoreCase('hyperlink')){
            newmapField.put(fieldResult.getLabel(),fieldResult.getName() + '.Name');
         }else if(fieldResult.getName() != 'Id'){
            newmapField.put(fieldResult.getLabel(),fieldResult.getName());
         }
      }
      return newmapField;
   }

   public class MapFieldWrapperClass {
      @AuraEnabled
      public Map<String, String> selectedFieldsMap;
      @AuraEnabled
      public Map<String, String> allAvailableFieldsMap;
   }
}