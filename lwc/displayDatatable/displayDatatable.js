import { LightningElement, api } from 'lwc';
import retreieveRecords from '@salesforce/apex/dynamicDataTableController.retreieveRecords';
const sfdcBaseURL = window.location.origin;
export default class DisplayDatatable extends LightningElement {

  @api objectNameDatatable; // holding objectName value which is passed from App builder property
  @api fieldAPINames = ''; // holds list of fields API Name for the given object
  @api customSettingName;  // Custom Setting which will store all the fields selected 
  tempColumn = []; //temporary column list to store columns
  data = []; // data to display on datatable
  columns; //final columns/headers of datatable
  newobj = {};
  newDataArray = [];
  defaultSortDirection = 'asc';
  isRecordsVisible = false;
  retObj = {};

  retriveRecordHandler(event) {
    this.resetDataTable();
    let args = JSON.parse(JSON.stringify(event.detail));
    this.fieldAPINames = args.selectedFieldsValue.toString();
    args.fieldAPIMapSelected2.forEach(itemVal => {
      if (itemVal.value.includes(".Name") && itemVal.value !== 'RecordType.Name') {
        this.tempColumn = [...this.tempColumn,
        {
          label: itemVal.label,
          fieldName: itemVal.value.replace(/\.+Name/g, 'URL'),
          type: 'url',
          typeAttributes: {
            label: {
              fieldName: itemVal.value.replace(/\./g, '')
            },
            target: '_blank'
          },
          sortable: true
        }];
      } else {
        this.tempColumn = [...this.tempColumn,
        {
          label: itemVal.label,
          fieldName: itemVal.value.includes(".Name") ? itemVal.value.replace(/\./g, '') : itemVal.value,
          sortable: true
        }];
      }
    });
    this.columns = this.tempColumn;
    this.retreieveRecordsfromApex();
  }


  retreieveRecordsfromApex() {
    console.log(' this.objectNameDatatable =>' + this.objectNameDatatable);
    console.log(' this.fieldAPINames =>' + this.fieldAPINames);
    retreieveRecords({
      objectName: this.objectNameDatatable,
      fieldAPINames: this.fieldAPINames
    })
      .then(data => {
        console.log(' data =>' + data);
        data.forEach(itemVal => {
          this.retObj = this.iterate(itemVal);
          if (Object.keys(this.retObj).length !== 0 && this.retObj.constructor === Object) {
            this.newDataArray = [...this.newDataArray, this.retObj];
          }
        });
        console.log(' this.newDataArray =>' + JSON.stringify(this.newDataArray));
        this.data = [...this.newDataArray];
        console.log(' this.data =>' + JSON.stringify(this.data) );
        if (this.data) {
          console.log(' inside if(this.data) ');
          this.isRecordsVisible = true;
          setTimeout(() => {
            this.updateGenericDatatable(this.data, this.columns);
         }, 100);
        }
        this.error = undefined;
      }).catch(error => {
        this.error = error;
        this.data = undefined;
      })
  }

  updateGenericDatatable(tablerecords,tablecolumns) {
    console.log('this.tablecolumns ' + JSON.stringify(tablecolumns));
    console.log('this.tablerecords ' + JSON.stringify(tablerecords));
    if (tablecolumns !== undefined) {
      this.updateColumns(tablecolumns);
      console.log('tablecolumns ' + tablecolumns);
    }
    if (tablerecords !== undefined) {
      this.updateRecords(tablerecords);
      console.log('tablerecords ' + tablerecords);
    }
  }

  updateColumns(columns) {
    if (this.template.querySelector('c-generic-data-table-l-w-c')) {
      this.template.querySelector('c-generic-data-table-l-w-c').updateColumns(columns);
    }
  }

  updateRecords(records) {
    if (this.template.querySelector('c-generic-data-table-l-w-c')) {
      this.template.querySelector('c-generic-data-table-l-w-c').refreshTable(records);
    }
  }


  iterate(obj) {
    this.newobj = {}; // reset newobj
    for (var property in obj) {
      // this if blocks check if the object has any property
      if (obj.hasOwnProperty(property)) {
        let xmlString = obj[property];
        // if block to all Reference field as URL clickable
        if (typeof xmlString === "object") {
          if (property !== 'RecordType') {
            this.newobj[property + 'URL'] = sfdcBaseURL + '/' + obj[property].Id;
          }
          this.newobj[property + 'Name'] = obj[property].Name;
        }
        // if block to make all Formula fields URL clickable
        else if (typeof xmlString === "string" && xmlString.includes('href')) {
          let doc = new DOMParser().parseFromString(xmlString, "text/xml");
          let PATTERN_FOR_EXTERNAL_URLS = /^(\w+:)?\/\//;
          let href = doc.querySelector('a').getAttribute('href');
          //alert("href.search(PATTERN_FOR_EXTERNAL_URLS)" +href.search(PATTERN_FOR_EXTERNAL_URLS));
          if (href !== undefined && href.search(PATTERN_FOR_EXTERNAL_URLS) !== -1 || href.includes('www'))
            this.newobj[property + 'URL'] = href;
          else {
            this.newobj[property + 'URL'] = sfdcBaseURL + href;
          }
          this.newobj[property + 'Name'] = doc.firstChild.innerHTML;
        }
        // this if block is to all all other fields values/property and to stop adding the RecordId to the final object 
        else if (property !== 'Id') {
          this.newobj[property] = obj[property];
        }
      }//if
    }//for loop
    return this.newobj;
  }// iterate fnc

  // to reset the DataTable
  resetDataTable() {
    this.tempColumn = [];
    this.data = [];
    this.columns = [];
    this.newobj = {};
    this.newDataArray = [];
  }
}