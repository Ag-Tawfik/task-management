<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Task;

class TaskController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        return Task::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:Pending,In Progress,Completed'],
        ]);

        $data['user_id'] = $request->user()->id;
        $data['status'] = $data['status'] ?? 'Pending';

        return Task::create($data);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id)
    {
        return Task::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $task = Task::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', 'required', 'in:Pending,In Progress,Completed'],
        ]);

        $task->update($data);

        return $task;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id)
    {
        $task = Task::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        $task->delete();

        return response()->noContent();
    }
}
