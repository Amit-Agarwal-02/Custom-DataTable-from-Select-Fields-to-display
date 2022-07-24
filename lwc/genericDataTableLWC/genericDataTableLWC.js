import { LightningElement, api, track } from 'lwc';

export default class GenericDataTableLWC extends LightningElement {

    @api records = [];
    @api sortable = false;
    @track _selectedRows = [];
    @api showPagination = false;
    @api paginationSize = 10;
    @api hideCheckBox = false;
    @api showRowNumber = false;

    @track _pageSize = 10;
    @track sortedDirection = 'asc';

    @track draftValues = [];
    _startFromIndex = 0;
    _paginationInfo = {
        currentPage: 0,
        totalPages: 0
    };
    pageSize;
    @track _columns = [];
    @track recordSelected = false;
    @track _hideCheckBox = false;
    @api _records = [];
    @track recordsInPage = [];
    @track byPass = false;

    connectedCallback() {
        this.doinit();
        this.showFirstPage();
    }

    doinit = () => {
        if (this.paginationSize == undefined || this.paginationSize !== 10) {
            this.pageSize = this.paginationSize;
        }
        this._paginationInfo.totalPages = (((this.records.length / this.pageSize) - ((this.records.length % this.pageSize) / this.pageSize)) + (((this.records.length % this.pageSize) === 0) ? 0 : 1));
        this.fetchRecordFromRecords();
    }

    fetchRecordFromRecords = () => {
        if (this.records != undefined && this.columns != undefined) {
            this.recordsInPage = this.records;
            this._records = this.records;
        }

    }

    // invoked when column is changed
    @api
    get columns() {
        return this._columns;
    }
    set columns(value) {
        this._columns = value;
    }

    // invoked when selectedRows is changed
    @api
    get selectedRows() {
        return this._selectedRows;
    }
    set selectedRows(value) {
        if (this.byPass == false) {
            this._selectedRows = value;
        }
    }
    // invoked when page size is changed
    @api
    get pageSize() {
        if (!this.isNotBlank(this._pageSize)) this._pageSize = 10;
        return parseInt(this._pageSize, 10);
    }
    /**
     * @param {number} value
     */
    set pageSize(value) {
        this._pageSize = value;
    }

    isNotBlank = (checkString) => {
        return (checkString !== '' && checkString !== null && checkString !== undefined);
    }

    get pageNumberInfo() {
        if (this._records && this._records.length > 0) {
            this._paginationInfo.currentPage = (((this._startFromIndex + 1) / this.pageSize) - (((this._startFromIndex + 1) % this.pageSize) / this.pageSize) + ((((this._startFromIndex + 1) % this.pageSize) === 0) ? 0 : 1));
            return 'Page ' + this._paginationInfo.currentPage + ' of ' + this._paginationInfo.totalPages;
        }
        return 'Page 0 of 0';
    }
    //PAGINATION - INVOKED WHEN PAGE SIZE IS CHANGED

    paginationRefresh = () => {
        this._startFromIndex = 0;
    }

    //PAGINATION - SHOW First PAGE
    showFirstPage = () => {
        this.paginationRefresh();
        this.processPagination();
    }
    //PAGINATION - SHOW PREVIOUS PAGE
    showPreviousPage() {
        if (this._startFromIndex > 0) {
            this._startFromIndex = this._startFromIndex - this.pageSize;
            this.processPagination();
        }
    }

    //PAGINATION - SHOW NEXT PAGE
    showNextPage() {
        if (this._startFromIndex + this.pageSize < this._records.length) {
            this._startFromIndex = this._startFromIndex + this.pageSize;
            this.processPagination();
        }
    }

    //PAGINATION - SHOW LAST PAGE
    showLastPage = () => {
        let result = this._records.length % this.pageSize;
        if (this._startFromIndex >= 0) {
            if (result === 0) {
                this._startFromIndex = this._records.length - this.pageSize;
                this.processPagination();
            } else {
                this._startFromIndex = this._records.length - result;
                this.processPagination(true, -result);
            }
        }
    }


    // paginate the records
    processPagination(lastSetOfRecords = null, lastNumberOfRecords = null) {
        if (lastSetOfRecords) {
            this.recordsInPage = this._records.slice(lastNumberOfRecords);
        } else {
            this.recordsInPage = this._records.slice(this._startFromIndex, this.pageSize + this._startFromIndex);
        }
    }

    @api updateColumns(columns) {
        this.columns = [...columns];
    }

    @api refreshTable(result) {
        if (result.length === 0) {
            this.records = result;
        }
        this.refresh();
        if (result.length === 0) {
            console.log('Page length 0');
            this._paginationInfo = {
                currentPage: 0,
                totalPages: 0
            };
        }
    }


    refresh() {
        this.doinit();
        this.showFirstPage();
    }


    @api getSelected() {
        var el = this.template.querySelector('lightning-datatable');
        return el.getSelectedRows();
    }

    //Pagination Information in datatable footer
    get recordsInfo() {
        if (this._records.length > 0) {
            this._endIndex = this._startFromIndex + this.pageSize;
            return 'Showing ' + (this._startFromIndex + 1) + " to " + ((this._endIndex > this._records.length) ? this._records.length : this._endIndex) + " of " + this._records.length + " records";
        }
        return 'Showing 0 of 0';
    }
}