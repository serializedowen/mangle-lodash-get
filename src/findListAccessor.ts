/**
 *
 * @param path
 * @returns
 */
const parseAccessor = (path: string) => {
  const [memberAccessor, accessorIndex] = path.match(/\[([0-9])+\]/) || [];
  const propertyAccessor = path.replace(memberAccessor, '');

  return {
    memberAccessor: accessorIndex,
    propertyAccessor,
  };
};

export default parseAccessor;
