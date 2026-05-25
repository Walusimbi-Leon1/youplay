import React, { useState } from 'react';

const AnswerInput = ({ onSubmit, disabled }) => {
  const [value, setValue] = useState('');

  const submit = (event) => {
    event.preventDefault();
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue('');
  };

  return (
    <form className="answer-input-panel" onSubmit={submit}>
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Type your answer here..."
        disabled={disabled}
        className="answer-input"
      />
      <button type="submit" className="btn btn-primary" disabled={disabled || !value.trim()}>
        Submit
      </button>
    </form>
  );
};

export default AnswerInput;
