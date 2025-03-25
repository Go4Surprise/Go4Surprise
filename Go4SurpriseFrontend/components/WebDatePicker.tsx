import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './CustomDatePicker.css';
import 'date-fns/locale/es';

export default function WebDatePicker({ selected, onChange }) {
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      dateFormat="yyyy-MM-dd"
      maxDate={new Date()}
      minDate={new Date(1900, 0, 1)}
      className="custom-datepicker"
      popperClassName="datepicker-popper"
      popperPlacement="bottom-start"
      portalId="root-portal"
      showYearDropdown // Enable year dropdown
      showMonthDropdown // Enable month dropdown
      dropdownMode="select" // Use dropdowns instead of scroll
      yearDropdownItemNumber={100}
      scrollableYearDropdown // Optional: make year dropdown scrollable
      locale="es"
    />
  );
}