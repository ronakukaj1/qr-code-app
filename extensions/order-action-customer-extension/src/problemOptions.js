export const dtcProblemOptions = [
  { value: "1", label: "Package item is damaged" },
  { value: "2", label: "Missing items" },
  { value: "3", label: "Wrong item was sent" },
  { value: "4", label: "Item arrived too late" },
  { value: "5", label: "Never received item" },
];

export const b2bProblemOptions = dtcProblemOptions.concat([
  {
    value: "6",
    label: "Package sent to the wrong company location",
  },
]);

/**
 * @param {string} value
 * @param {boolean} isB2BCustomer
 */
export function getProblemLabel(value, isB2BCustomer) {
  const options = isB2BCustomer ? b2bProblemOptions : dtcProblemOptions;
  return options.find((option) => option.value === value)?.label ?? value;
}
