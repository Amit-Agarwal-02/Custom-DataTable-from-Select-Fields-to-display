import { LightningElement, api } from 'lwc';
import retreieveFields from '@salesforce/apex/dynamicDataTableController.retreieveFields';
import updateFields from '@salesforce/apex/dynamicDataTableController.updateSelectedFields';
export default class ChildDatatable extends LightningElement {

  @api fecthObjectName;  // holds object Name passed from parent component
  fieldItems = [];  // all fields map of field API and field Label 
  _selected = [];   // all fields selected
  selectedfieldItems = [];
  isModalOpen = false;
  isError = false;
  selectedfieldMap ;
  isRendered;
  fieldAPINames;


  connectedCallback() {
    // function to fetch all fields map field API and field Label 
    retreieveFields({
      ObjectName: this.fecthObjectName
    })
      .then(data => {
        console.log('wrapper data =>' + data);
        let result = JSON.parse(data);
        this.selectedfieldMap = result.selectedFieldsMap;
        let fieldAPILabelMap = result.allAvailableFieldsMap;
        console.log(' wrapper data.selectedfieldMap => ' + JSON.stringify( this.selectedfieldMap));
        console.log(' wrapper result.fieldAPILabelMap => ' + JSON.stringify(fieldAPILabelMap));
        for (var key in fieldAPILabelMap) {
          if (fieldAPILabelMap.hasOwnProperty(key)) {
            this.fieldItems.push({ value: fieldAPILabelMap[key], label: key });
          }
        }
        if(this.selectedfieldMap){
          for (var key in this.selectedfieldMap) {
            if (this.selectedfieldMap.hasOwnProperty(key)) {
              this.selectedfieldItems.push(this.selectedfieldMap[key]);
            }
          }
          this._selected = [... this.selectedfieldItems];
          this.handleRetreiveRecords();
        }
        this.error = undefined;
      }).catch(error => {
        this.error = error;
        this.fieldItems = undefined;
      })
  }

  handleSelectFields() {
    this.isModalOpen = true;
    //this._selected = [];
  }

  closeModal() {
    this.isModalOpen = false;
    this.isError = false;
  }

  get statusOptions() {
    console.log(' this.fieldItems => ' + JSON.stringify(this.fieldItems));
    return this.fieldItems;
  }

  get selectedValues() {
    return this._selected;
  }

  get errorStatus() {
    return this.isError;
  }

  handleChange(e) {
    this._selected = e.detail.value;
    console.log(' this._selected => ' + this._selected);
    if (this._selected.length > 0) {
      this.isError = false;
    }
  }

  handleSaveButtonClick(){
    if (this._selected.length > 0) {
      this.updateSelectedFields();
      this.handleRetreiveRecords();
    }else{
      this.isError = true;
    }
  }

  updateSelectedFields() {
    console.log('updateSelectedFields => ' );
    let selectedFieldsValue = this._selected;
    this.fieldAPINames = selectedFieldsValue.toString();
    console.log('updateSelectedFields this.fecthObjectName => ' +this.fecthObjectName);
    console.log('updateSelectedFields this.fieldAPINames => '+this.fieldAPINames);
    updateFields({
      objectName: this.fecthObjectName,
      fieldAPINames: this.fieldAPINames})
      .then(results => {
        console.log('results => ' + results);
      })
      .catch(error => {
        console.log('error => ' + JSON.stringify(error));
      });
  }

  handleRetreiveRecords() {
    let selectedFieldsValue = this._selected;
    const fieldAPIMapSelected = [];

    if (this._selected.length > 0) {

      this.isModalOpen = false;
      this.isError = false;

      selectedFieldsValue.forEach(option => {
        let currentOption = this.fieldItems.find(obj => obj.value === option);
        fieldAPIMapSelected.push({
          label: currentOption.label,
          value: currentOption.value
        });
      });
      console.log('selectedFieldsValue => ' + selectedFieldsValue);

      const fieldAPIMapSelected2 = fieldAPIMapSelected;
      console.log(' this.fieldAPIMapSelected2 => ' + JSON.stringify(fieldAPIMapSelected2));
      const evtCustomEvent = new CustomEvent(
        'retreive',
        {
          detail: { selectedFieldsValue, fieldAPIMapSelected2 }
        });
      this.dispatchEvent(evtCustomEvent);
      //this._selected = [];
    }
    else {
      this.isError = true;
    }
  }
}