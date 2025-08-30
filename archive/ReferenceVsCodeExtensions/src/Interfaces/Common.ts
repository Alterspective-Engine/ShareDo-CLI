/**
 * Common Parent Extension Interface
 *
 * Provides a generic interface for objects that can have a parent reference.
 * Used for hierarchical data structures in ShareDo.
 */

export interface IParentExtention<T>
{
	parent?: T
}

