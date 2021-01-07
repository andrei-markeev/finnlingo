const {createHash} = Npm.require('crypto');

export function getShallowHash(ob) {
  const hash = createHash('sha1');
  const keys = Object.keys(ob);
  keys.sort();

  keys.forEach(key => {
    hash.update(key).update('' + ob[key]);
  });

  return hash.digest('hex');
}
