import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { AutocompleteSelect } from '../AutocompleteSelect';

describe('AutocompleteSelect', () => {
  it('reports a freeSolo value typed without confirming it', () => {
    const onChange = jest.fn();
    render(
      <AutocompleteSelect
        values={['5', '6']}
        label="UIAA"
        value={null}
        onChange={onChange}
        freeSolo
      />,
    );

    fireEvent.change(screen.getByLabelText('UIAA'), { target: { value: '7' } });

    expect(onChange).toHaveBeenCalledWith(expect.anything(), '7');
  });

  it('reports null when the typed value is erased', () => {
    const onChange = jest.fn();
    render(
      <AutocompleteSelect
        values={['5', '6']}
        label="UIAA"
        value="7"
        onChange={onChange}
        freeSolo
      />,
    );

    fireEvent.change(screen.getByLabelText('UIAA'), { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith(expect.anything(), null);
  });

  it('does not report typing when freeSolo is off', () => {
    const onChange = jest.fn();
    render(
      <AutocompleteSelect
        values={['5', '6']}
        label="UIAA"
        value={null}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('UIAA'), { target: { value: '5' } });

    expect(onChange).not.toHaveBeenCalled();
  });
});
