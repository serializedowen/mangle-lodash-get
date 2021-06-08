import React from 'react';
import lodash from 'lodash';
import * as _ from 'lodash';
import { get } from 'lodash';
import gg from 'lodash/get';

export default function Test() {
  const aaa = {};

  lodash.get(aaa, 'a.b.c');
  gg(aaa, 'a.b.c');

  const path = 'arg.gee.f';
  get(aaa, 'aa.bb.cc', 'tt');
  get(aaa, '[2].bb[3].cc', 'tt');
  get(aaa, path, 'tt');
  return <div></div>;
}
