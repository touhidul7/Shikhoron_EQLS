import React, { useEffect, useState } from 'react';
import api from '../api';

export default function ClassSectionDropdown({ value, onChange, sectionValue, onSectionChange }) {
  const [classes, setClasses] = useState([]);
  useEffect(() => {
    api.get('/classes').then(res => {
      setClasses(res.data.classes);
      // Expose classes globally for registration validation
      window.classSectionDropdownClasses = res.data.classes;
    });
  }, []);
  const selectedClass = classes.find(c => c.name === value);
  return (
    <>
      <select name="class" value={value} onChange={onChange} required className="border rounded px-3 py-2">
        <option value="">Select Class</option>
        {classes.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
      </select>
      {selectedClass && selectedClass.sections && selectedClass.sections.length > 0 && (
        <select name="section" value={sectionValue} onChange={onSectionChange} className="border rounded px-3 py-2">
          <option value="">Select Group/Section (optional)</option>
          {selectedClass.sections.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      )}
    </>
  );
}
