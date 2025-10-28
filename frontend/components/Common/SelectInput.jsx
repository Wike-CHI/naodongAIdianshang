import React from 'react'
import { Select } from 'antd'

const { Option } = Select

const SelectInput = ({ value, onChange, options = [], placeholder }) => {
  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{ width: '100%' }}
      allowClear
    >
      {options.map((option) => (
        <Option key={option} value={option}>
          {option}
        </Option>
      ))}
    </Select>
  )
}

export default SelectInput