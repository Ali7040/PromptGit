import { DiffService } from './diff.service';

describe('DiffService', () => {
  const service = new DiffService({} as any);

  it('identical content → all equal', () => {
    const res = service['computeDiff']('a\nb', 'a\nb');
    expect(res.length).toBe(2);
    expect(res.every(l => l.type === 'equal')).toBe(true);
  });

  it('empty from → all inserts', () => {
    const res = service['computeDiff']('', 'a\nb');

    expect(res.length).toBe(2);
    expect(res.every(l => l.type === 'insert')).toBe(true);
  });

  it('empty to → all deletes', () => {
    const res = service['computeDiff']('a\nb', '');

    expect(res.length).toBe(2);
    expect(res.every(l => l.type === 'delete')).toBe(true);
  });

  it('completely different → delete + insert', () => {
    const res = service['computeDiff']('a', 'b');

    expect(res.length).toBe(2);
    expect(res[0].type).toBe('delete');
    expect(res[1].type).toBe('insert');
  });
});
