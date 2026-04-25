import { DiffService } from './diff.service';

describe('DiffService', () => {
  const service = new DiffService({} as any);

  it('identical content', () => {
    const res = service['computeDiff']('a\nb', 'a\nb');
    expect(res.every(l => l.type === 'equal')).toBe(true);
  });

  it('empty from → insert', () => {
    const res = service['computeDiff']('', 'a\nb');
    expect(res.filter(l => l.type === 'insert').length).toBe(2);
  });

  it('empty to → delete', () => {
    const res = service['computeDiff']('a\nb', '');
    expect(res.filter(l => l.type === 'delete').length).toBe(2);
  });
});